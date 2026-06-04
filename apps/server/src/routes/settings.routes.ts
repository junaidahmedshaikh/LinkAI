import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { settingsController } from "../controllers/settings.controller";
import { updateSettingsSchema } from "../validators/phase2.validator";

const router = Router();

router.use(authenticate);

router.get("/", settingsController.get);
router.put("/", validate(updateSettingsSchema), settingsController.update);

export default router;
