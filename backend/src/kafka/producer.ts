import { Kafka, Producer, Admin } from 'kafkajs';
import { env } from '../config/env';

const kafka = new Kafka({
  clientId: env.KAFKA_CLIENT_ID,
  brokers: env.KAFKA_BROKERS,
  retry: {
    initialRetryTime: 300,
    retries: 8,
  },
});

export const kafkaProducer: Producer = kafka.producer({
  idempotent: true,
  transactionTimeout: 30000,
});

export const kafkaAdmin: Admin = kafka.admin();

export const TOPICS = {
  NOTIFICATION_HIGH: 'notifications.high',
  NOTIFICATION_NORMAL: 'notifications.normal',
} as const;

export async function connectKafka(): Promise<void> {
  await kafkaAdmin.connect();
  console.log('[Kafka] Admin connected');

  await kafkaProducer.connect();
  console.log('[Kafka] Producer connected');
}

export async function disconnectKafka(): Promise<void> {
  await kafkaProducer.disconnect();
  await kafkaAdmin.disconnect();
  console.log('[Kafka] Disconnected');
}

export default kafka;
