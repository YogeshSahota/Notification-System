import { KafkaMessage } from 'kafkajs';
import { NotificationRepository } from '../modules/notification/notification.repository';
import { TemplateService } from '../modules/template/template.service';
import { RecipientRepository } from '../modules/recipient/recipient.repository';
import { getProvider } from '../channels/provider-factory';
import { Channel, NotificationStatus } from '@prisma/client';
import { KafkaNotificationMessage } from '../modules/notification/notification.service';
import { scheduleRetry } from './retry-handler';
import { env } from '../config/env';

const notificationRepo = new NotificationRepository();
const templateService = new TemplateService();
const recipientRepo = new RecipientRepository();

export async function processNotification(message: KafkaMessage): Promise<void> {
  const value = message.value?.toString();
  if (!value) {
    console.error('[Worker] Empty message received, skipping');
    return;
  }

  const payload: KafkaNotificationMessage = JSON.parse(value);
  const { notificationId, channel, templateId, variables } = payload;

  console.log(`[Worker] Processing notification ${notificationId} (${channel})`);

  try {
    const existing = await notificationRepo.findById(notificationId);
    if (!existing) {
      console.error(`[Worker] Notification ${notificationId} not found in DB, skipping`);
      return;
    }
    if (existing.status === NotificationStatus.DELIVERED || existing.status === NotificationStatus.SKIPPED) {
      console.log(`[Worker] Notification ${notificationId} already ${existing.status}, skipping (idempotent)`);
      return;
    }

    await notificationRepo.updateStatus(notificationId, NotificationStatus.PROCESSING);

    const template = await templateService.findById(templateId);
    const recipient = await recipientRepo.findById(payload.recipientId);
    if (!recipient) {
      throw new Error(`Recipient ${payload.recipientId} not found`);
    }

    const { subject, body } = templateService.renderTemplate(
      template.body,
      template.subject,
      variables,
    );

    const provider = getProvider(channel as Channel);
    const deliveryAddress = channel === 'email' ? recipient.email : recipient.phone;

    if (!deliveryAddress) {
      throw new Error(`Recipient has no ${channel === 'email' ? 'email' : 'phone'} address`);
    }

    const result = await provider.send({
      recipient: deliveryAddress,
      subject: subject ?? undefined,
      body,
    });

    if (result.success) {
      await notificationRepo.updateStatus(notificationId, NotificationStatus.DELIVERED);
      console.log(`[Worker] Notification ${notificationId} delivered (providerId: ${result.providerMessageId})`);
    } else {
      throw new Error(result.error || 'Provider returned failure');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Worker] Notification ${notificationId} failed: ${errorMessage}`);

    const notification = await notificationRepo.findById(notificationId);
    if (!notification) {
      console.error(`[Worker] Notification ${notificationId} not found in DB`);
      return;
    }

    const newRetryCount = notification.retryCount + 1;
    await notificationRepo.incrementRetryCount(notificationId);

    if (newRetryCount >= env.MAX_RETRY_COUNT) {
      await notificationRepo.updateStatus(notificationId, NotificationStatus.FAILED, errorMessage);
      await scheduleRetry(notificationId, newRetryCount);
    } else {
      await notificationRepo.updateStatus(notificationId, NotificationStatus.FAILED, errorMessage);
      await scheduleRetry(notificationId, newRetryCount);
    }
  }
}
