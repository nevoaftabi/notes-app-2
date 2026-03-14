import express, { NextFunction } from "express";
import { env } from "./config/env";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { Request, Response } from "express";
import cors from "cors";
import { pool } from "./db";
import {
  AuthenticatedRequest,
  CreateNoteBody,
  DeleteNoteSchema,
  getUser,
  PatchNoteBody,
  PatchNoteParams,
} from "./schemas";

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173"],
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

    if (!user) return res.sendStatus(401);

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
      "insert into notes(subject, body, user_id) values ($1, $2, $3) returning id",
      [parsedBody.data.subject, parsedBody.data.body, user.user.id],
    );
    const noteId = result.rows[0].id;
    return res.status(201).json({ noteId });
  } catch (error) {
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
      "update notes set subject=$1, body=$2 where id=$3 and user_id=$4",
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

    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update note"});
  }
});

app.get("/api/auth/notes", async (req: Request, res: Response) => {
  const user = req as AuthenticatedRequest;

  try {
    const result = await pool.query(
      "select id, subject, body from notes where user_id=$1",
      [user.user.id],
    );
    return res.status(200).json({ rows: result.rows });
  } catch (error) {
    return res.status(500).json({ message: "Couldn't retrieve notes"});
  }
});

app.delete("/api/auth/notes/:id", async (req: Request, res: Response) => {
  try {
    const user = req as AuthenticatedRequest;
    const parsedId = DeleteNoteSchema.safeParse(req.params);

    if (!parsedId.success) {
      return res.status(400).json({ message: "Bad note ID"});
    }

    const result = await pool.query(
      "delete from notes where id=$1 and user_id=$2",
      [parsedId.data.id, user.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Couldn't find note"});
    }

    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).json({ message: "Couldn't delete note"});
  }
});

export async function start() {
  app.listen(Number(env.PORT), () => {
    console.log(`Listening on port ${env.PORT}`);
  });
}

if (typeof require !== "undefined" && require.main === module) {
  start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
