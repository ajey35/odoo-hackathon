import { prisma } from '../lib/prisma';
import { ProjectWithMembers } from '../types';
import { NotificationService } from '../notifications/service';

export class ProjectService {
  static async createProject(name: string, description: string | undefined, ownerId: string) {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId,
        teamMemberships: {
          create: {
            userId: ownerId,
            role: 'OWNER',
          },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        teamMemberships: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: { tasks: true, teamMemberships: true },
        },
      },
    });

    return project;
  }

  static async getProjects(userId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: {
          teamMemberships: {
            some: { userId },
          },
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          teamMemberships: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          _count: {
            select: { tasks: true, teamMemberships: true },
          },
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({
        where: {
          teamMemberships: {
            some: { userId },
          },
        },
      }),
    ]);

    return {
      projects,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getProject(id: string, userId: string): Promise<ProjectWithMembers | null> {
    const project = await prisma.project.findFirst({
      where: {
        id,
        teamMemberships: {
          some: { userId },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        teamMemberships: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        _count: {
          select: { tasks: true, teamMemberships: true },
        },
      },
    });

    return project;
  }

  static async updateProject(id: string, data: { name?: string; description?: string }, userId: string) {
    // Check if user is owner or admin
    const membership = await prisma.teamMembership.findFirst({
      where: {
        projectId: id,
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!membership) {
      throw new Error('Insufficient permissions');
    }

    return prisma.project.update({
      where: { id },
      data,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { tasks: true, teamMemberships: true },
        },
      },
    });
  }

  static async deleteProject(id: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!project || project.ownerId !== userId) {
      throw new Error('Only project owner can delete the project');
    }

    return prisma.project.delete({
      where: { id },
    });
  }

  static async addMember(projectId: string, email: string, role: string, requesterId: string) {
    // Check if requester has permission
    const requesterMembership = await prisma.teamMembership.findFirst({
      where: {
        projectId,
        userId: requesterId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!requesterMembership) {
      throw new Error('Insufficient permissions');
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is already a member
    const existingMembership = await prisma.teamMembership.findFirst({
      where: {
        projectId,
        userId: user.id,
      },
    });

    if (existingMembership) {
      throw new Error('User is already a member of this project');
    }

    const membership = await prisma.teamMembership.create({
      data: {
        projectId,
        userId: user.id,
        role: role as any,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { name: true },
        },
      },
    });

    // Send notification
    await NotificationService.createNotification({
      type: 'PROJECT_INVITATION',
      message: `You have been added to project "${membership.project.name}"`,
      userId: user.id,
    });

    return membership;
  }

  static async removeMember(projectId: string, userId: string, requesterId: string) {
    // Check if requester has permission
    const requesterMembership = await prisma.teamMembership.findFirst({
      where: {
        projectId,
        userId: requesterId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!requesterMembership) {
      throw new Error('Insufficient permissions');
    }

    // Cannot remove project owner
    const targetMembership = await prisma.teamMembership.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (targetMembership?.role === 'OWNER') {
      throw new Error('Cannot remove project owner');
    }

    return prisma.teamMembership.delete({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });
  }
}