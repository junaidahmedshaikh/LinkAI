import dns from "dns";
import mongoose from "mongoose";
import { env, isProduction } from "./env";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");
export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);
  mongoose.set("autoIndex", !isProduction);
console.log("MONGO_URI:", env.MONGO_URI);
console.log("DB_NAME:", env.MONGO_DB_NAME);
  try {
    await mongoose.connect(env.MONGO_URI, {
      dbName: env.MONGO_DB_NAME,
      family: 4,
    });
  } catch (err) {
  console.error("CONNECT ERROR:", err);
  throw err;
}

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connection established");
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
  });

  console.log("MongoDB connected successfully");
}
