import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { activityController } from "../controllers/activity.controller";
import { activityQuerySchema } from "../validators/phase2.validator";

const router = Router();

router.use(authenticate);

router.get("/", validate(activityQuerySchema), activityController.list);

export default router;
