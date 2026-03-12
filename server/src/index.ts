import express, { NextFunction } from "express";
import { env } from "./config/env";
import { createClerkClient, User, verifyToken } from "@clerk/backend";
import { Request, Response } from "express";
import cors from "cors";
import pg from "pg";
import { pool } from "./db";
import { z } from 'zod';

const connectionString = env.DATABASE_URL;

type AuthenticatedRequest = Request & {
  user: User;
};

const DeleteNoteSchema = z.object({
    id: z.uuid()
});

const app = express();

const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

async function getUserId(req: Request) {
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
    console.log("Token verification");
    return null;
  }
}

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  }),
);

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[ROUTER] ${req.method} ${req.url}`);
  next();
});

app.use(async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureInitialized();
    next();
  } catch (err) {
    console.error("Initialization error:", err);
    res.status(500).json({ error: "Server initialization failed" });
  }
});

app.use(
  "/api/auth",
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await getUserId(req);

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    (req as AuthenticatedRequest).user = user;

    next();
  },
);

app.post("/api/auth/notes", async (req: Request, res: Response) => {
  // Use zod to validate the request!!!
  const user = req as AuthenticatedRequest;

  try {
    const result = await pool.query(
      "insert into notes(subject, body, user_id) values ($1, $2, $3) returning id",
      [req.body.subject, req.body.body, user.user.id],
    );
    const noteId = result.rows[0].id;
    return res
      .status(201)
      .json({ noteId });
  } catch (error) {
    console.log(`There was an error: ${error}`);
    return res.status(500).json({ message: "Server error" });
  }
});

const PatchNoteBody = z.object({
    subject: z.string().trim().min(1).max(100),
    body: z.string().trim().min(1).max(3000)
});

const PatchNoteParams = z.object({
    id: z.uuid()
})

app.patch("/api/auth/notes/:id", async (req: Request, res: Response) => {
    const parsedParams = PatchNoteParams.safeParse(req.params);
    const parsedBody = PatchNoteBody.safeParse(req.body);
    
    if(!parsedParams.success || !parsedBody.success) {
        return res.status(400).json({ message: "Invalid request"});
    }

    const user = req as AuthenticatedRequest;

    try {
        const result = await pool.query("update notes set subject=$1, body=$2 where id=$3 and user_id=$4", 
            [parsedBody.data.subject, parsedBody.data.body, parsedParams.data.id, user.user.id]);
        return res.status(200).json({ message: "Note updated successfully"});
    }
    catch(error) {
        console.log("There was an error updating a note: ", error);
        return res.status(500).json({ message: "Server error"});
    }
})

app.get("/api/auth/notes", async (req: Request, res: Response) => {
    const user = req as AuthenticatedRequest;

    try {
        const result = await pool.query("select id, subject, body from notes where user_id=$1", [user.user.id]);
        return res.status(200).json({ rows: result.rows });
    }
    catch(error) {
        console.log(`There was an error: ${error}`);
        return res.status(500).json({ message: "Server error"});
    }
});

app.delete("/api/auth/notes/:id", async (req: Request, res: Response) => {
    try {
        const user = req as AuthenticatedRequest;

        const parsedId = DeleteNoteSchema.safeParse(req.params);

        if(!parsedId.success) {
            return res.status(400).json({ message: "Invalid request"});
        }

        const result = await pool.query("delete from notes where id=$1 and user_id=$2", [parsedId.data.id, user.user.id]);

        return res.status(200).json({ message: "Note deleted"});
    }
    catch(error) {
        console.log(`There was an error with delete: ${error}`);
        return res.status(500).json({ message: "Server error"});
    }
});

export async function start() {
  await ensureInitialized();
  app.listen(Number(env.PORT), () => {
    console.log(`Listening on port ${env.PORT}`);
  });
}

let initPromise: Promise<void> | null = null;
function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      try {
      } catch (err) {}
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

if (typeof require !== "undefined" && require.main === module) {
  start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
