import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  channel: z.enum(['email', 'sms']),
  subject: z.string().max(200).optional(),
  body: z.string().min(1),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  channel: z.enum(['email', 'sms']).optional(),
  subject: z.string().max(200).nullable().optional(),
  body: z.string().min(1).optional(),
});

export type CreateTemplateDto = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateDto = z.infer<typeof updateTemplateSchema>;
