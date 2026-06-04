import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { profileController } from "../controllers/profile.controller";
import { updateProfileSchema } from "../validators/phase2.validator";
import { uploadAvatar } from "../middlewares/upload.middleware";
import { handleMulter } from "../middlewares/multerHandler.middleware";

const router = Router();

router.get("/public/:userId", profileController.getPublicProfile);

router.use(authenticate);

router.get("/", profileController.getProfile);
router.put("/", validate(updateProfileSchema), profileController.updateProfile);
router.post("/avatar", handleMulter(uploadAvatar), profileController.uploadAvatar);
router.delete("/avatar", profileController.deleteAvatar);

export default router;
