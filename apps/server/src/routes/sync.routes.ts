import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { syncController } from "../controllers/sync.controller";
import { syncHeartbeatSchema } from "../validators/sync.validator";

const router = Router();

router.use(authenticate);

router.get("/user", syncController.getUser);
router.get("/settings", syncController.getSettings);
router.get("/usage", syncController.getUsage);
router.get("/permissions", syncController.getPermissions);
router.get("/feature-flags", syncController.getFeatureFlags);
router.post("/heartbeat", validate(syncHeartbeatSchema), syncController.heartbeat);

export default router;
