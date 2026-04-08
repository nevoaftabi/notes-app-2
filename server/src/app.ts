import express, { NextFunction } from "express";
import cors from "cors";
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { pool } from "./db";
import {
  AuthenticatedRequest,
  CreateNoteBody,
  DeleteNoteSchema,
  GetNoteParams,
  getUser,
  ImportNotesBody,
  PatchNoteBody,
  PatchNoteParams,
  PermanentDeleteNoteParams,
  PublicNoteParams,
  RestoreNoteParams,
  ShareNoteParams,
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
      "insert into notes(subject, body, folder, pinned, tags, is_public, public_id, user_id) values ($1, $2, $3, $4, $5, false, null, $6) returning id, created_at, updated_at",
      [
        parsedBody.data.subject,
        parsedBody.data.body,
        parsedBody.data.folder,
        parsedBody.data.pinned,
        parsedBody.data.tags,
        user.user.id,
      ],
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
      "update notes set updated_at = now(), subject=$1, body=$2, folder=$3, pinned=$4, tags=$5 where id=$6 and user_id=$7 returning updated_at",
      [
        parsedBody.data.subject,
        parsedBody.data.body,
        parsedBody.data.folder,
        parsedBody.data.pinned,
        parsedBody.data.tags,
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

app.post("/api/auth/notes/import", async (req: Request, res: Response) => {
  const user = req as AuthenticatedRequest;
  const parsedBody = ImportNotesBody.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({ message: "Invalid import payload" });
  }

  let imported = 0;
  let skipped = 0;

  try {
    for (const note of parsedBody.data.notes) {
      const duplicateCheck = await pool.query(
        "select id from notes where user_id = $1 and subject = $2 and body = $3 and folder = $4 and pinned = $5 and tags = $6 limit 1",
        [user.user.id, note.subject, note.body, note.folder, note.pinned, note.tags],
      );

      if (duplicateCheck.rowCount) {
        skipped += 1;
        continue;
      }

      await pool.query(
        "insert into notes(subject, body, folder, pinned, tags, is_public, public_id, user_id, created_at, updated_at) values ($1, $2, $3, $4, $5, false, null, $6, $7, $8)",
        [
          note.subject,
          note.body,
          note.folder,
          note.pinned,
          note.tags,
          user.user.id,
          note.createdAt,
          note.updatedAt,
        ],
      );
      imported += 1;
    }

    return res.status(200).json({ imported, skipped });
  } catch {
    return res.status(500).json({ message: "Failed to import notes" });
  }
});

app.get("/api/auth/notes", async (req: Request, res: Response) => {
  const user = req as AuthenticatedRequest;

  try {
    const result = await pool.query(
      `select id, subject, body, folder, pinned, tags, is_public as "isPublic", public_id as "publicId", deleted_at as "deletedAt", created_at as "createdAt", updated_at as "updatedAt" from notes where user_id=$1 order by deleted_at asc nulls first, pinned desc, updated_at desc`,
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
      `select id, subject, body, folder, pinned, tags, is_public as "isPublic", public_id as "publicId", deleted_at as "deletedAt", created_at as "createdAt", updated_at as "updatedAt" from notes where id=$1 and user_id=$2`,
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

app.post("/api/auth/notes/:id/share", async (req: Request, res: Response) => {
  const user = req as AuthenticatedRequest;
  const parsedId = ShareNoteParams.safeParse(req.params);

  if (!parsedId.success) {
    return res.status(400).json({ message: "Bad note ID" });
  }

  try {
    const result = await pool.query(
      "update notes set is_public = true, public_id = coalesce(public_id, $1), updated_at = now() where id = $2 and user_id = $3 returning public_id as \"publicId\", updated_at as \"updatedAt\"",
      [randomUUID(), parsedId.data.id, user.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Couldn't find note" });
    }

    return res.status(200).json(result.rows[0]);
  } catch {
    return res.status(500).json({ message: "Failed to share note" });
  }
});

app.delete("/api/auth/notes/:id/share", async (req: Request, res: Response) => {
  const user = req as AuthenticatedRequest;
  const parsedId = ShareNoteParams.safeParse(req.params);

  if (!parsedId.success) {
    return res.status(400).json({ message: "Bad note ID" });
  }

  try {
    const result = await pool.query(
      "update notes set is_public = false, updated_at = now() where id = $1 and user_id = $2 returning updated_at as \"updatedAt\", public_id as \"publicId\"",
      [parsedId.data.id, user.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Couldn't find note" });
    }

    return res.status(200).json(result.rows[0]);
  } catch {
    return res.status(500).json({ message: "Failed to unshare note" });
  }
});

app.get("/api/public/notes/:publicId", async (req: Request, res: Response) => {
  const parsedId = PublicNoteParams.safeParse(req.params);

  if (!parsedId.success) {
    return res.status(400).json({ message: "Bad public note ID" });
  }

  try {
    const result = await pool.query(
      `select subject, body, folder, pinned, tags, created_at as "createdAt", updated_at as "updatedAt"
       from notes where public_id = $1 and is_public = true and deleted_at is null`,
      [parsedId.data.publicId],
    );

    if (result.rowCount !== 1) {
      return res.status(404).json({ message: "Couldn't find public note" });
    }

    return res.status(200).json(result.rows[0]);
  } catch {
    return res.status(500).json({ message: "Couldn't retrieve public note" });
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
      "update notes set deleted_at = now(), is_public = false, updated_at = now() where id=$1 and user_id=$2 and deleted_at is null",
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

app.post("/api/auth/notes/:id/restore", async (req: Request, res: Response) => {
  const user = req as AuthenticatedRequest;
  const parsedId = RestoreNoteParams.safeParse(req.params);

  if (!parsedId.success) {
    return res.status(400).json({ message: "Bad note ID" });
  }

  try {
    const result = await pool.query(
      `update notes
       set deleted_at = null, updated_at = now()
       where id = $1 and user_id = $2 and deleted_at is not null
       returning deleted_at as "deletedAt", updated_at as "updatedAt"`,
      [parsedId.data.id, user.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Couldn't find note" });
    }

    return res.status(200).json(result.rows[0]);
  } catch {
    return res.status(500).json({ message: "Couldn't restore note" });
  }
});

app.delete("/api/auth/notes/:id/permanent", async (req: Request, res: Response) => {
  const user = req as AuthenticatedRequest;
  const parsedId = PermanentDeleteNoteParams.safeParse(req.params);

  if (!parsedId.success) {
    return res.status(400).json({ message: "Bad note ID" });
  }

  try {
    const result = await pool.query(
      "delete from notes where id = $1 and user_id = $2",
      [parsedId.data.id, user.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Couldn't find note" });
    }

    return res.sendStatus(200);
  } catch {
    return res.status(500).json({ message: "Couldn't permanently delete note" });
  }
});
