import { prisma } from '../lib/prisma';
import { ProjectWithMembers } from '../types';
import { NotificationService } from '../notifications/service';

export class ProjectService {
  // Create a new project
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
        owner: { select: { id: true, name: true, email: true } },
        teamMemberships: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { tasks: true, teamMemberships: true } },
      },
    });

    return project;
  }

  // Get paginated projects for a user
  static async getProjects(userId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { teamMemberships: { some: { userId } } },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          teamMemberships: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
          _count: { select: { tasks: true, teamMemberships: true } },
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where: { teamMemberships: { some: { userId } } } }),
    ]);

    // Add completedTasks for progress calculation
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const completedTasks = await prisma.task.count({
          where: { projectId: project.id, status: 'DONE' },
        });
        return {
          ...project,
          _count: { ...project._count, completedTasks },
        };
      })
    );

    return {
      projects: projectsWithProgress,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Get single project with members and progress
  static async getProject(id: string, userId: string): Promise<ProjectWithMembers | null> {
    const project = await prisma.project.findFirst({
      where: { id, teamMemberships: { some: { userId } } },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        teamMemberships: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        _count: { select: { tasks: true, teamMemberships: true } },
      },
    });

    if (!project) return null;

    const completedTasks = await prisma.task.count({ where: { projectId: project.id, status: 'DONE' } });

    return { ...project, _count: { ...project._count, completedTasks } };
  }

  // Update project
  static async updateProject(id: string, data: { name?: string; description?: string }, userId: string) {
    const membership = await prisma.teamMembership.findFirst({
      where: { projectId: id, userId, role: { in: ['OWNER', 'ADMIN'] } },
    });

    if (!membership) throw new Error('Insufficient permissions');

    return prisma.project.update({
      where: { id },
      data,
      include: { owner: { select: { id: true, name: true, email: true } }, _count: { select: { tasks: true, teamMemberships: true } } },
    });
  }

  // Delete project
  static async deleteProject(id: string, userId: string) {
    const project = await prisma.project.findUnique({ where: { id }, select: { ownerId: true } });
    if (!project || project.ownerId !== userId) throw new Error('Only project owner can delete the project');
    return prisma.project.delete({ where: { id } });
  }

  // Add member to project
  static async addMember(projectId: string, email: string, role: string, requesterId: string) {
    const requesterMembership = await prisma.teamMembership.findFirst({
      where: { projectId, userId: requesterId, role: { in: ['OWNER', 'ADMIN'] } },
    });
    if (!requesterMembership) throw new Error('Insufficient permissions');

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    const existingMembership = await prisma.teamMembership.findFirst({ where: { projectId, userId: user.id } });
    if (existingMembership) throw new Error('User is already a member of this project');

    const membership = await prisma.teamMembership.create({
      data: { projectId, userId: user.id, role: role as any },
      include: { user: { select: { id: true, name: true, email: true } }, project: { select: { name: true } } },
    });

    await NotificationService.createNotification({
      type: 'PROJECT_INVITATION',
      message: `You have been added to project "${membership.project.name}"`,
      userId: user.id,
    });

    return membership;
  }

  // Remove member from project
  static async removeMember(projectId: string, userId: string, requesterId: string) {
    const requesterMembership = await prisma.teamMembership.findFirst({
      where: { projectId, userId: requesterId, role: { in: ['OWNER', 'ADMIN'] } },
    });
    if (!requesterMembership) throw new Error('Insufficient permissions');

    const targetMembership = await prisma.teamMembership.findFirst({ where: { projectId, userId } });
    if (targetMembership?.role === 'OWNER') throw new Error('Cannot remove project owner');

    return prisma.teamMembership.delete({ where: { userId_projectId: { userId, projectId } } });
  }

  // Utility function: count completed tasks (can be reused elsewhere)
  static async countCompletedTasks(projectId: string) {
    return prisma.task.count({ where: { projectId, status: 'DONE' } });
  }
}
