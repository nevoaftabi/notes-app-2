import { z } from 'zod';
import { User } from "@clerk/backend";
import { Request, Response } from "express";
import { env } from "./config/env";
import { createClerkClient, verifyToken } from "@clerk/backend";

const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export type AuthenticatedRequest = Request & {
  user: User;
};

export const DeleteNoteSchema = z.object({
  id: z.uuid(),
});

export const PatchNoteBody = z.object({
  subject: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1).max(3000),
});

export const GetNoteParams = z.object({
  id: z.uuid()
})

export const PatchNoteParams = z.object({
  id: z.uuid(),
});

export const CreateNoteBody = z.object({
  subject: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1).max(3000),
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
      authorizedParties: ["http://localhost:5173"],
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