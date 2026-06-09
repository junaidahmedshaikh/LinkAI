import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { aiController } from "../controllers/ai.controller";
import { generateCommentSchema } from "../validators/ai.validator";

const router = Router();

router.use(authenticate);

router.post("/comments/generate", validate(generateCommentSchema), aiController.generateComment);
router.get("/comments/history", aiController.getCommentHistory);
router.delete("/comments/:id", aiController.deleteComment);
router.get("/comments/search", aiController.searchComments);

export default router;
