import { z } from "zod";
import { User } from "@clerk/backend";
import { Request } from "express";
import { env } from "./config/env";
import { createClerkClient, verifyToken } from "@clerk/backend";

const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export type AuthenticatedRequest = Request & {
  user: User;
};

export const DeleteNoteSchema = z.object({
  id: z.uuid(),
});

const BaseNoteFields = {
  subject: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1).max(3000),
  folder: z.string().trim().max(40),
  pinned: z.boolean(),
  tags: z.array(z.string().trim().min(1).max(20)).max(8),
};

export const PatchNoteBody = z.object({
  ...BaseNoteFields,
});

export const GetNoteParams = z.object({
  id: z.uuid(),
});

export const PatchNoteParams = z.object({
  id: z.uuid(),
});

export const CreateNoteBody = z.object({
  ...BaseNoteFields,
});

export const ShareNoteParams = z.object({
  id: z.uuid(),
});

export const RestoreNoteParams = z.object({
  id: z.uuid(),
});

export const PermanentDeleteNoteParams = z.object({
  id: z.uuid(),
});

export const PublicNoteParams = z.object({
  publicId: z.uuid(),
});

export const ImportNotesBody = z.object({
  notes: z.array(
    z.object({
      ...BaseNoteFields,
      id: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
      isPublic: z.boolean().optional(),
      publicId: z.string().nullable().optional(),
    }),
  ).max(100),
});

export async function getUser(req: Request) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const verifiedToken = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
      authorizedParties: [
        process.env.FRONTEND_BASE_URL ?? "http://localhost:5173",
      ],
    });

    const userId = verifiedToken.sub;

    if (!userId) {
      return null;
    }

    return await clerkClient.users.getUser(userId);
  } catch (error) {
    console.log("Token verification failed ", error);
    return null;
  }
}
