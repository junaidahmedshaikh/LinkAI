import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { linkedInProfileController } from "../controllers/linkedin-profile.controller";
import { linkedInProfileSchema } from "../validators/phase2.validator";

const router = Router();

router.use(authenticate);

router.get("/", linkedInProfileController.get);
router.put("/", validate(linkedInProfileSchema), linkedInProfileController.update);

export default router;
