import { Pool } from "pg";
import { env } from "./config/env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

export async function ensureNotesSchema() {
  await pool.query(`
    alter table notes
    add column if not exists folder text not null default '',
    add column if not exists pinned boolean not null default false,
    add column if not exists tags text[] not null default '{}',
    add column if not exists is_public boolean not null default false,
    add column if not exists public_id uuid,
    add column if not exists deleted_at timestamptz;
  `);

  await pool.query(`
    create unique index if not exists notes_public_id_key
    on notes(public_id)
    where public_id is not null;
  `);
}
