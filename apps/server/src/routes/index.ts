import { Router } from "express";
import mongoose from "mongoose";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import settingsRoutes from "./settings.routes";
import securityRoutes from "./security.routes";
import dashboardRoutes from "./dashboard.routes";
import adminRoutes from "./admin.routes";
import extensionRoutes from "./extension.routes";
import syncRoutes from "./sync.routes";
import aiRoutes from "./ai.routes";

const router = Router();

router.get("/health", (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    message: dbConnected ? "LinkAI API is running" : "Database connection failed",
    database: dbConnected ? "connected" : "disconnected",
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/settings", settingsRoutes);
router.use("/security", securityRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/admin", adminRoutes);
router.use("/extension", extensionRoutes);
router.use("/sync", syncRoutes);
router.use("/ai", aiRoutes);

export default router;
