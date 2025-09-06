import { prisma } from '../lib/prisma';
import { NotificationService } from '../notifications/service';

export class TaskService {
  static async createTask(data: {
    title: string;
    description?: string;
    projectId: string;
    assignedTo?: string;
    dueDate?: string;
  }, creatorId: string) {
    // Check if creator is a project member
    const membership = await prisma.teamMembership.findFirst({
      where: {
        projectId: data.projectId,
        userId: creatorId,
      },
    });

    if (!membership) {
      throw new Error('You are not a member of this project');
    }

    // If assigned to someone, check if they are a project member
    if (data.assignedTo) {
      const assigneeMembership = await prisma.teamMembership.findFirst({
        where: {
          projectId: data.projectId,
          userId: data.assignedTo,
        },
      });

      if (!assigneeMembership) {
        throw new Error('Assigned user is not a member of this project');
      }
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        assignedTo: data.assignedTo,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Send notification if task is assigned
    if (data.assignedTo && data.assignedTo !== creatorId) {
      await NotificationService.createNotification({
        type: 'TASK_ASSIGNED',
        message: `You have been assigned a new task: "${task.title}" in project "${task.project.name}"`,
        userId: data.assignedTo,
      });
    }

    return task;
  }

  static async getTasks(userId: string, filters?: {
    projectId?: string;
    status?: string;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      projectId,
      status,
      assignedTo,
      page = 1,
      limit = 10,
    } = filters || {};

    const offset = (page - 1) * limit;

    // Get user's project IDs
    const userProjectIds = await prisma.teamMembership.findMany({
      where: { userId },
      select: { projectId: true },
    });

    const projectIds = userProjectIds.map(m => m.projectId);

    if (projectIds.length === 0) {
      return {
        tasks: [],
        meta: { page, limit, total: 0, totalPages: 0 },
      };
    }

    const where: any = {
      projectId: projectId ? projectId : { in: projectIds },
    };

    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
        skip: offset,
        take: limit,
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getTask(id: string, userId: string) {
    // Check if user has access to this task through project membership
    const task = await prisma.task.findFirst({
      where: {
        id,
        project: {
          teamMemberships: {
            some: { userId },
          },
        },
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return task;
  }

  static async updateTask(
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      assignedTo?: string;
      dueDate?: string;
    },
    userId: string
  ) {
    const task = await this.getTask(id, userId);
    if (!task) {
      throw new Error('Task not found');
    }

    // If changing assignee, check if new assignee is project member
    if (data.assignedTo && data.assignedTo !== task.assignedTo) {
      const assigneeMembership = await prisma.teamMembership.findFirst({
        where: {
          projectId: task.projectId,
          userId: data.assignedTo,
        },
      });

      if (!assigneeMembership) {
        throw new Error('Assigned user is not a member of this project');
      }
    }

    const oldStatus = task.status;
    const oldAssignee = task.assignedTo;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Send notifications for changes
    if (data.assignedTo && data.assignedTo !== oldAssignee && data.assignedTo !== userId) {
      await NotificationService.createNotification({
        type: 'TASK_ASSIGNED',
        message: `You have been assigned to task: "${updatedTask.title}" in project "${updatedTask.project.name}"`,
        userId: data.assignedTo,
      });
    }

    if (data.status && data.status !== oldStatus && oldAssignee && oldAssignee !== userId) {
      await NotificationService.createNotification({
        type: 'TASK_UPDATED',
        message: `Task "${updatedTask.title}" status changed to ${data.status}`,
        userId: oldAssignee,
      });
    }

    return updatedTask;
  }

  static async deleteTask(id: string, userId: string) {
    const task = await this.getTask(id, userId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Check if user is project admin/owner or task assignee
    const membership = await prisma.teamMembership.findFirst({
      where: {
        projectId: task.projectId,
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!membership && task.assignedTo !== userId) {
      throw new Error('Insufficient permissions to delete this task');
    }

    return prisma.task.delete({
      where: { id },
    });
  }
}