import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envPaths = [
  path.resolve(process.cwd(), "server/.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env"),
];

const envPath = envPaths.find((candidate) => fs.existsSync(candidate));

dotenv.config(envPath ? { path: envPath } : undefined);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

function envOr(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  PORT: envOr("PORT", "3000"),
  CLERK_SECRET_KEY: requireEnv("CLERK_SECRET_KEY"),
  DATABASE_URL: requireEnv("DATABASE_URL"),
  NODE_ENV: envOr("NODE_ENV", "development"),
};
