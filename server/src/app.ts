import express, { NextFunction } from "express";
import cors from "cors";
import { Request, Response } from "express";
import { pool } from "./db";
import {
  AuthenticatedRequest,
  CreateNoteBody,
  DeleteNoteSchema,
  GetNoteParams,
  getUser,
  PatchNoteBody,
  PatchNoteParams,
} from "./schemas";

const FRONTEND_URL = process.env.FRONTEND_BASE_URL ?? "http://localhost:5173";

export const app = express();
export default app;

app.use(express.json());

app.use(
  cors({
    origin: [FRONTEND_URL],
    credentials: true,
  }),
);

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ message: "Invalid JSON" });
  }

  next(error);
});

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[ROUTER] ${req.method} ${req.url}`);
  next();
});

app.use(
  "/api/auth",
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await getUser(req);

    if (!user) {
      return res.sendStatus(401);
    }

    (req as AuthenticatedRequest).user = user;

    next();
  },
);

app.post("/api/auth/notes", async (req: Request, res: Response) => {
  const user = req as AuthenticatedRequest;
  const parsedBody = CreateNoteBody.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({ message: "Invalid note format" });
  }

  try {
    const result = await pool.query(
      "insert into notes(subject, body, user_id) values ($1, $2, $3) returning id, created_at, updated_at",
      [parsedBody.data.subject, parsedBody.data.body, user.user.id],
    );
    const row = result.rows[0];
    return res.status(201).json({
      noteId: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch {
    return res.status(500).json({ message: "Failed to create note" });
  }
});

app.patch("/api/auth/notes/:id", async (req: Request, res: Response) => {
  const parsedParams = PatchNoteParams.safeParse(req.params);
  const parsedBody = PatchNoteBody.safeParse(req.body);

  if (!parsedParams.success || !parsedBody.success) {
    return res.status(400).json({ message: "Invalid note format" });
  }

  const user = req as AuthenticatedRequest;

  try {
    const result = await pool.query(
      "update notes set updated_at = now(), subject=$1, body=$2 where id=$3 and user_id=$4 returning updated_at",
      [
        parsedBody.data.subject,
        parsedBody.data.body,
        parsedParams.data.id,
        user.user.id,
      ],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Couldn't find note" });
    }

    return res.status(200).json({ updatedAt: result.rows[0].updated_at });
  } catch {
    return res.status(500).json({ message: "Failed to update note" });
  }
});

app.get("/api/auth/notes", async (req: Request, res: Response) => {
  const user = req as AuthenticatedRequest;

  try {
    const result = await pool.query(
      `select id, subject, body, created_at as "createdAt", updated_at as "updatedAt" from notes where user_id=$1 order by updated_at desc`,
      [user.user.id],
    );
    return res.status(200).json({ rows: result.rows });
  } catch {
    return res.status(500).json({ message: "Couldn't retrieve notes" });
  }
});

app.get("/api/auth/notes/:id", async (req: Request, res: Response) => {
  const user = req as AuthenticatedRequest;
  const parsedId = GetNoteParams.safeParse(req.params);

  if (!parsedId.success) {
    return res.status(400).json({ message: "Bad note ID" });
  }

  try {
    const result = await pool.query(
      `select id, subject, body, created_at as "createdAt", updated_at as "updatedAt" from notes where id=$1 and user_id=$2`,
      [parsedId.data.id, user.user.id],
    );

    if (result.rowCount !== 1) {
      return res.status(404).json({ message: "Couldn't find note" });
    }

    return res.status(200).json(result.rows[0]);
  } catch {
    return res.status(500).json({ message: "Couldn't retrieve note" });
  }
});

app.delete("/api/auth/notes/:id", async (req: Request, res: Response) => {
  const user = req as AuthenticatedRequest;
  const parsedId = DeleteNoteSchema.safeParse(req.params);

  if (!parsedId.success) {
    return res.status(400).json({ message: "Bad note ID" });
  }

  try {
    const result = await pool.query(
      "delete from notes where id=$1 and user_id=$2",
      [parsedId.data.id, user.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Couldn't find note" });
    }

    return res.sendStatus(200);
  } catch {
    return res.status(500).json({ message: "Couldn't delete note" });
  }
});
