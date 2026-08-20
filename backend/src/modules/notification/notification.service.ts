import { NotificationRepository, CreateNotificationInput } from './notification.repository';
import { TemplateService } from '../template/template.service';
import { PreferenceService } from '../preference/preference.service';
import { RecipientRepository } from '../recipient/recipient.repository';
import { NotFoundError, ValidationError, DuplicateRequestError, RateLimitError } from '../../common/errors/app-error';
import { kafkaProducer, TOPICS } from '../../kafka';
import { Channel, NotificationStatus, Priority } from '@prisma/client';
import { scheduleNotification } from '../../scheduler/scheduler.service';
import { checkRateLimit } from '../../redis/rate-limiter';

export interface KafkaNotificationMessage {
  notificationId: string;
  recipientId: string;
  channel: Channel;
  templateId: string;
  variables: Record<string, string>;
  priority: Priority;
}

export class NotificationService {
  private repo: NotificationRepository;
  private templateService: TemplateService;
  private preferenceService: PreferenceService;
  private recipientRepo: RecipientRepository;

  constructor() {
    this.repo = new NotificationRepository();
    this.templateService = new TemplateService();
    this.preferenceService = new PreferenceService();
    this.recipientRepo = new RecipientRepository();
  }

  async create(data: CreateNotificationInput) {
    const rateCheck = await checkRateLimit(data.recipientId);
    if (!rateCheck.allowed) {
      throw new RateLimitError(3600);
    }

    const recipient = await this.recipientRepo.findById(data.recipientId);
    if (!recipient) {
      throw new NotFoundError('Recipient', data.recipientId);
    }

    await this.templateService.findById(data.templateId);

    const isOptedIn = await this.preferenceService.isOptedIn(data.recipientId, data.channel);
    if (!isOptedIn) {
      const notification = await this.repo.create(data);
      await this.repo.updateStatus(notification.id, NotificationStatus.SKIPPED, 'Recipient opted out');
      return { ...notification, status: NotificationStatus.SKIPPED };
    }

    if (data.idempotencyKey) {
      const existing = await this.repo.findByIdempotencyKey(data.idempotencyKey);
      if (existing) {
        throw new DuplicateRequestError();
      }
    }

    if (data.channel === Channel.sms && !recipient.phone) {
      throw new ValidationError('Recipient does not have a phone number for SMS notifications');
    }

    if (data.channel === Channel.email && !recipient.email) {
      throw new ValidationError('Recipient does not have an email address for email notifications');
    }

    const notification = await this.repo.create(data);

    if (data.sendAt && data.sendAt > new Date()) {
      await scheduleNotification(notification.id, data.sendAt);
      return notification;
    }

    await this.publishToKafka(notification.id, data);

    return notification;
  }

  private async publishToKafka(notificationId: string, data: CreateNotificationInput): Promise<void> {
    const message: KafkaNotificationMessage = {
      notificationId,
      recipientId: data.recipientId,
      channel: data.channel,
      templateId: data.templateId,
      variables: data.variables ?? {},
      priority: data.priority ?? Priority.NORMAL,
    };

    const topic = data.priority === Priority.HIGH ? TOPICS.NOTIFICATION_HIGH : TOPICS.NOTIFICATION_NORMAL;

    await kafkaProducer.send({
      topic,
      messages: [
        {
          key: data.recipientId,
          value: JSON.stringify(message),
        },
      ],
    });

    console.log(`[Kafka] Published notification ${notificationId} to ${topic}`);
  }

  async findById(id: string) {
    const notification = await this.repo.findById(id);
    if (!notification) {
      throw new NotFoundError('Notification', id);
    }
    return notification;
  }

  async findAll(filters?: {
    status?: NotificationStatus;
    channel?: Channel;
    priority?: Priority;
    recipientId?: string;
  }) {
    return this.repo.findAll(filters);
  }
}
