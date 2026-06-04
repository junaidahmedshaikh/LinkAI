import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { onboardingSchema } from "../validators/auth.validator";

const router = Router();

router.post(
  "/onboarding",
  authenticate,
  validate(onboardingSchema),
  userController.completeOnboarding
);

export default router;
