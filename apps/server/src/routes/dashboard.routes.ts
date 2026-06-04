import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { dashboardController } from "../controllers/dashboard.controller";

const router = Router();

router.use(authenticate);

router.get("/overview", dashboardController.overview);

export default router;
