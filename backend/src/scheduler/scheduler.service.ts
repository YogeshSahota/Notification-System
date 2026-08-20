import { Queue, Worker } from 'bullmq';
import redis from '../config/redis';
import { kafkaProducer } from '../kafka/producer';
import { TOPICS } from '../kafka/producer';
import prisma from '../config/database';
import { KafkaNotificationMessage } from '../modules/notification/notification.service';

const SCHEDULER_QUEUE = 'scheduled-notifications';

export const schedulerQueue = new Queue(SCHEDULER_QUEUE, { connection: redis });

let schedulerWorker: Worker<{ notificationId: string }> | null = null;

export function startSchedulerWorker(): Worker<{ notificationId: string }> {
  schedulerWorker = new Worker<{ notificationId: string }>(
    SCHEDULER_QUEUE,
    async (job) => {
      const { notificationId } = job.data;

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification || notification.status !== 'PENDING') {
        return;
      }

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

      console.log(`[Scheduler] Notification ${notificationId} published to ${topic}`);
    },
    { connection: redis, concurrency: 5 },
  );

  schedulerWorker.on('failed', (job, err) => {
    console.error(`[Scheduler] Job ${job?.id} failed:`, err);
  });

  schedulerWorker.on('completed', (job) => {
    console.log(`[Scheduler] Job ${job.id} completed`);
  });

  console.log('[Scheduler] Worker started');
  return schedulerWorker;
}

export async function scheduleNotification(notificationId: string, sendAt: Date): Promise<void> {
  const delay = sendAt.getTime() - Date.now();

  if (delay <= 0) {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (notification && notification.status === 'PENDING') {
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
    }
    return;
  }

  await schedulerQueue.add('send-notification', { notificationId }, { delay });
  console.log(`[Scheduler] Notification ${notificationId} scheduled for ${sendAt.toISOString()}`);
}

export async function closeScheduler(): Promise<void> {
  if (schedulerWorker) {
    await schedulerWorker.close();
  }
  await schedulerQueue.close();
  console.log('[Scheduler] Worker and queue closed');
}
