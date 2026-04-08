import { app } from "./app";
import { env } from "./config/env";
import { ensureNotesSchema } from "./db";

export default app;

export async function start() {
  await ensureNotesSchema();

  app.listen(Number(env.PORT), () => {
    console.log(`Listening on port ${env.PORT}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
