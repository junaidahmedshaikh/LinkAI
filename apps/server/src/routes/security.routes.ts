import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { securityController } from "../controllers/security.controller";
import { changePasswordSchema } from "../validators/phase2.validator";

const router = Router();

router.use(authenticate);

router.put("/change-password", validate(changePasswordSchema), securityController.changePassword);
router.post("/logout-all", securityController.logoutAll);
router.get("/sessions", securityController.getSessions);
router.delete("/sessions/:sessionId", securityController.revokeSession);

export default router;
