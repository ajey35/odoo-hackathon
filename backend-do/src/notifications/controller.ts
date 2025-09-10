// backend/notifications/controller.ts
import { Request, Response } from "express";
import { NotificationService } from "./service";

export class NotificationController {
  static async getNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.id; // ✅ assumes auth middleware sets req.user
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { read, page, limit } = req.query;
      const data = await NotificationService.getUserNotifications(userId, {
        read: read === "true" ? true : read === "false" ? false : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.json(data);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      await NotificationService.markAsRead(id, userId);

      res.json({ success: true });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  }

  static async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      await NotificationService.markAllAsRead(userId);

      res.json({ success: true });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  }
}
