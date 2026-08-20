import { Consumer, KafkaMessage } from 'kafkajs';
import kafka from './producer';
import { env } from '../config/env';
import { TOPICS } from './producer';

interface ConsumerConfig {
  groupId: string;
  topic: string;
  concurrency?: number;
}

export async function createConsumer(
  config: ConsumerConfig,
  handler: (message: KafkaMessage) => Promise<void>,
): Promise<Consumer> {
  const consumer = kafka.consumer({
    groupId: config.groupId,
    sessionTimeout: 30000,
    heartbeatInterval: 10000,
  });

  await consumer.connect();
  await consumer.subscribe({ topic: config.topic, fromBeginning: false });

  await consumer.run({
    autoCommit: false,
    partitionsConsumedConcurrently: config.concurrency || 3,
    eachMessage: async ({ message, partition, topic }) => {
      try {
        await handler(message);
        await consumer.commitOffsets([
          { topic, partition, offset: (parseInt(message.offset, 10) + 1).toString() },
        ]);
      } catch (err) {
        console.error(`[Kafka Consumer] Error processing message on ${topic}:${partition}:`, err);
      }
    },
  });

  console.log(`[Kafka Consumer] Group '${config.groupId}' subscribed to '${config.topic}'`);
  return consumer;
}

export async function startConsumers(
  handler: (message: KafkaMessage) => Promise<void>,
): Promise<Consumer[]> {
  const highConsumer = await createConsumer(
    { groupId: env.KAFKA_CONSUMER_GROUP_HIGH, topic: TOPICS.NOTIFICATION_HIGH, concurrency: 5 },
    handler,
  );

  const normalConsumer = await createConsumer(
    { groupId: env.KAFKA_CONSUMER_GROUP_NORMAL, topic: TOPICS.NOTIFICATION_NORMAL, concurrency: 2 },
    handler,
  );

  return [highConsumer, normalConsumer];
}

export async function disconnectConsumers(consumers: Consumer[]): Promise<void> {
  for (const consumer of consumers) {
    await consumer.disconnect();
  }
  console.log('[Kafka] All consumers disconnected');
}
