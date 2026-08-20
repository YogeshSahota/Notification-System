import { z } from 'zod';

export const createRecipientSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  name: z.string().optional(),
});

export const updateRecipientSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
});

export type CreateRecipientDto = z.infer<typeof createRecipientSchema>;
export type UpdateRecipientDto = z.infer<typeof updateRecipientSchema>;
