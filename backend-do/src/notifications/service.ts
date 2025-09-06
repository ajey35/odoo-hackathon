import { prisma } from '../lib/prisma';

export class NotificationService {
  static async createNotification(data: {
    type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'PROJECT_INVITATION' | 'DEADLINE_APPROACHING' | 'NEW_MESSAGE';
    message: string;
    userId: string;
  }) {
    return prisma.notification.create({
      data,
    });
  }

  static async getUserNotifications(
    userId: string,
    filters?: { read?: boolean; page?: number; limit?: number }
  ) {
    const { read, page = 1, limit = 20 } = filters || {};
    const offset = (page - 1) * limit;

    const where: any = { userId };
    if (read !== undefined) where.read = read;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.update({
      where: {
        id: notificationId,
        userId, // Ensure user owns the notification
      },
      data: { read: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });
  }
}