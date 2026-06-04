import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { extensionController } from "../controllers/extension.controller";
import {
  extensionActivitySchema,
  extensionHeartbeatSchema,
} from "../validators/extension.validator";
import {
  extensionConnectSchema,
  extensionDisconnectSchema,
} from "../validators/sync.validator";
import { extensionConnectController } from "../controllers/sync.controller";

const router = Router();

router.use(authenticate);

router.post("/connect", validate(extensionConnectSchema), extensionConnectController.connect);
router.post("/disconnect", validate(extensionDisconnectSchema), extensionConnectController.disconnect);
router.get("/me", extensionController.getMe);
router.get("/settings", extensionController.getSettings);
router.post("/activity", validate(extensionActivitySchema), extensionController.logActivity);
router.post("/heartbeat", validate(extensionHeartbeatSchema), extensionController.heartbeat);

export default router;
