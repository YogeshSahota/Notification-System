import { z } from 'zod';

export const createPreferenceSchema = z.object({
  userId: z.string().min(1),
  channel: z.enum(['email', 'sms']),
  optedIn: z.boolean().optional().default(true),
});

export const updatePreferenceSchema = z.object({
  optedIn: z.boolean(),
});

export type CreatePreferenceDto = z.infer<typeof createPreferenceSchema>;
export type UpdatePreferenceDto = z.infer<typeof updatePreferenceSchema>;
