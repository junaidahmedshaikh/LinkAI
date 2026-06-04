import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { sendSuccess } from "../utils/apiResponse.util";

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/", (_req, res) => {
  sendSuccess(res, "Admin module — coming in a future phase", { ready: true });
});

export default router;
