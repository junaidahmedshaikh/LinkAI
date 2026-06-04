import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { resumeController } from "../controllers/resume.controller";
import { uploadResume } from "../middlewares/upload.middleware";
import { handleMulter } from "../middlewares/multerHandler.middleware";

const router = Router();

router.use(authenticate);

router.post("/upload", handleMulter(uploadResume), resumeController.upload);
router.get("/", resumeController.list);
router.delete("/:id", resumeController.delete);
router.put("/:id/primary", resumeController.setPrimary);

export default router;
