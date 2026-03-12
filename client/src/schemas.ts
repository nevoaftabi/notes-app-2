import { z } from 'zod';

export const NoteForm = z.object({
    subject: z.string().trim().min(1),
    body: z.string().trim().min(1)
})