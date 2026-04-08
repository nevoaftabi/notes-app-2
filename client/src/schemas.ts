import { z } from "zod";

const tagSchema = z.string().trim().min(1).max(20);

export const NoteForm = z.object({
  subject: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1).max(3000),
  folder: z.string().trim().max(40),
  pinned: z.boolean(),
  tags: z.array(tagSchema).max(8),
});

export const EditNoteForm = z.object({
  subject: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1).max(3000),
  folder: z.string().trim().max(40),
  pinned: z.boolean(),
  tags: z.array(tagSchema).max(8),
});

