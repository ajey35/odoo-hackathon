import { Router } from "express";
import { NotificationController } from "./controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// Explicitly cast so Express knows it's middleware
router.use(authenticate as any);

router.get("/", NotificationController.getNotifications);
router.put("/:id/read", NotificationController.markAsRead);
router.put("/mark-all-read", NotificationController.markAllAsRead);

export default router;
