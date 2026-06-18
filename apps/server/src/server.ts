import { createApp } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");
async function connectDatabaseWithRetry(): Promise<void> {
  for (;;) {
    try {
      await connectDatabase();
      return;
    } catch (error) {
      console.error("MongoDB connection failed");
console.dir(error, { depth: null });
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

async function bootstrap(): Promise<void> {
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  void connectDatabaseWithRetry();
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
