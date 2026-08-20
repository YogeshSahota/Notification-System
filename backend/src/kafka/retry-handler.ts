import { Queue, Worker } from 'bullmq';
import redis from '../config/redis';
import { kafkaProducer, TOPICS } from '../kafka/producer';
import { env } from '../config/env';
import prisma from '../config/database';
import { NotificationStatus } from '@prisma/client';
import { KafkaNotificationMessage } from '../modules/notification/notification.service';

const RETRY_QUEUE = 'notification-retries';

export const retryQueue = new Queue(RETRY_QUEUE, { connection: redis });

let retryWorker: Worker<{ notificationId: string }> | null = null;

export function startRetryWorker(): Worker<{ notificationId: string }> {
  retryWorker = new Worker<{ notificationId: string }>(
    RETRY_QUEUE,
    async (job) => {
      const { notificationId } = job.data;

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification || notification.status !== 'FAILED') {
        return;
      }

      if (notification.retryCount >= env.MAX_RETRY_COUNT) {
        await prisma.deadLetterQueue.create({
          data: {
            notificationId: notification.id,
            failureReason: notification.failureReason || 'Max retries exceeded',
          },
        });

        console.log(`[Retry] Notification ${notificationId} moved to DLQ after ${notification.retryCount} retries`);
        return;
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.PENDING },
      });

      const message: KafkaNotificationMessage = {
        notificationId: notification.id,
        recipientId: notification.recipientId,
        channel: notification.channel,
        templateId: notification.templateId,
        variables: notification.variables as Record<string, string>,
        priority: notification.priority,
      };

      const topic =
        notification.priority === 'HIGH' ? TOPICS.NOTIFICATION_HIGH : TOPICS.NOTIFICATION_NORMAL;

      await kafkaProducer.send({
        topic,
        messages: [
          {
            key: notification.recipientId,
            value: JSON.stringify(message),
          },
        ],
      });

      console.log(`[Retry] Notification ${notificationId} republished to ${topic} (attempt ${notification.retryCount + 1}/${env.MAX_RETRY_COUNT})`);
    },
    { connection: redis, concurrency: 5 },
  );

  retryWorker.on('failed', (job, err) => {
    console.error(`[Retry] Job ${job?.id} failed:`, err);
  });

  retryWorker.on('completed', (job) => {
    console.log(`[Retry] Job ${job.id} completed`);
  });

  console.log('[Retry] Worker started');
  return retryWorker;
}

export async function scheduleRetry(notificationId: string, retryCount: number): Promise<void> {
  const delayIndex = Math.min(retryCount, env.RETRY_DELAYS_MS.length - 1);
  const delay = env.RETRY_DELAYS_MS[delayIndex];

  await retryQueue.add(
    'retry-notification',
    { notificationId },
    { delay },
  );

  console.log(`[Retry] Notification ${notificationId} scheduled for retry in ${delay}ms (attempt ${retryCount + 1}/${env.MAX_RETRY_COUNT})`);
}

export async function closeRetryQueue(): Promise<void> {
  if (retryWorker) {
    await retryWorker.close();
  }
  await retryQueue.close();
  console.log('[Retry] Worker and queue closed');
}
