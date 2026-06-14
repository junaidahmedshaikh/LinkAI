import mongoose from "mongoose";
import { env, isProduction } from "./env";

export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);
  mongoose.set("autoIndex", !isProduction);

  await mongoose.connect(env.MONGO_URI, {
    maxPoolSize: 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    retryReads: true,
  });

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
