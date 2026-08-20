import { z } from 'zod';

export const notificationListQuerySchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'DELIVERED', 'FAILED', 'SKIPPED']).optional(),
  channel: z.enum(['email', 'sms']).optional(),
  priority: z.enum(['HIGH', 'NORMAL']).optional(),
  recipientId: z.string().optional(),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
