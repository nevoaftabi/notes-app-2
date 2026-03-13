import { z } from 'zod';

export const NoteForm = z.object({
    subject: z.string().trim().min(1).max(100),
    body: z.string().trim().min(1).max(3000)
});

