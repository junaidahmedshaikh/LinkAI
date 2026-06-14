import express from "express";
import path from "path";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import passport from "passport";
import { env, isProduction } from "./config/env";
import { configurePassport } from "./config/passport";
import apiRoutes from "./routes";
import { sendError } from "./utils/apiResponse.util";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware";

export function createApp(): express.Application {
  const app = express();

  configurePassport();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (
          origin === env.CLIENT_URL ||
          origin.startsWith("chrome-extension://") ||
          (!isProduction && origin.startsWith("http://localhost"))
        ) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Extension-Version"],
    })
  );

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: isProduction ? 100 : 1000,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));
  app.use(cookieParser());
  app.use(passport.initialize());

  app.use(
    "/uploads",
    express.static(path.resolve(env.UPLOAD_DIR), {
      maxAge: isProduction ? "7d" : 0,
    })
  );

  app.use("/api", (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
      sendError(res, "Database connection is not ready yet", 503);
      return;
    }
    next();
  });

  app.use("/api", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
