import prisma from '../../config/database';
import { Channel, NotificationStatus, Priority } from '@prisma/client';

export interface CreateNotificationInput {
  recipientId: string;
  channel: Channel;
  templateId: string;
  variables?: Record<string, string>;
  priority?: Priority;
  sendAt?: Date;
  idempotencyKey?: string;
}

export class NotificationRepository {
  async create(data: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        recipientId: data.recipientId,
        channel: data.channel,
        templateId: data.templateId,
        variables: data.variables ?? {},
        priority: data.priority ?? Priority.NORMAL,
        sendAt: data.sendAt,
        idempotencyKey: data.idempotencyKey,
      },
    });
  }

  async findById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
      include: { template: true, recipient: true },
    });
  }

  async findByIdempotencyKey(key: string) {
    return prisma.notification.findUnique({
      where: { idempotencyKey: key },
    });
  }

  async updateStatus(id: string, status: NotificationStatus, failureReason?: string) {
    return prisma.notification.update({
      where: { id },
      data: {
        status,
        ...(failureReason && { failureReason }),
      },
    });
  }

  async incrementRetryCount(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { retryCount: { increment: 1 } },
    });
  }

  async findAll(filters?: {
    status?: NotificationStatus;
    channel?: Channel;
    priority?: Priority;
    recipientId?: string;
  }) {
    return prisma.notification.findMany({
      where: filters,
      include: { template: true, recipient: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
