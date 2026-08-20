import { z } from 'zod';

export const createNotificationSchema = z.object({
  recipientId: z.string().min(1),
  channel: z.enum(['email', 'sms']),
  templateId: z.string().min(1),
  variables: z.record(z.string(), z.string()).optional().default({}),
  priority: z.enum(['HIGH', 'NORMAL']).optional().default('NORMAL'),
  sendAt: z.string().datetime().optional().transform((val) => (val ? new Date(val) : undefined)),
  idempotencyKey: z.string().optional(),
});

export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;
