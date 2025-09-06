import bcrypt from 'bcryptjs';
import { prisma } from '../setup';
import { JWTUtil } from '../../src/utils/jwt';
import logger from '../../src/utils/logger';
import { UserRole, TaskStatus } from '@prisma/client';

export interface TestUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  token: string;
}

export interface TestProject {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
}

export interface TestTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  projectId: string;
  assignedTo?: string | null;
}

export class TestHelpers {
  static async createTestUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
    const defaultData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.USER,
    };

    const data = { ...defaultData, ...userData };
    const hashedPassword = await bcrypt.hash(data.password, 12);

    logger.info(`📝 Creating test user: ${data.email}`);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    const token = JWTUtil.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    }).accessToken;

    logger.info(`✅ Test user created: ${user.id}`);

    return {
      ...user,
      password: data.password, // Return original password for testing
      token,
    };
  }

  static async createTestProject(
    ownerId: string,
    projectData: Partial<TestProject> = {}
  ): Promise<TestProject> {
    const defaultData = {
      name: 'Test Project',
      description: 'A test project for testing',
    };

    const data = { ...defaultData, ...projectData };

    logger.info(`📝 Creating test project: ${data.name}`);

    const project = await prisma.project.create({
      data: {
        ...data,
        ownerId,
        teamMemberships: {
          create: {
            userId: ownerId,
            role: 'OWNER',
          },
        },
      },
    });

    logger.info(`✅ Test project created: ${project.id}`);

    return project;
  }

  static async createTestTask(
    projectId: string,
    taskData: Partial<TestTask> = {}
  ): Promise<TestTask> {
    const defaultData = {
      title: 'Test Task',
      description: 'A test task for testing',
      status: TaskStatus.TODO,
    };

    const data = { ...defaultData, ...taskData };

    logger.info(`📝 Creating test task: ${data.title}`);

    const task = await prisma.task.create({
      data: {
        ...data,
        projectId,
      },
    });

    logger.info(`✅ Test task created: ${task.id}`);

    return task;
  }

  static async addUserToProject(
    userId: string,
    projectId: string,
    role: string = 'MEMBER'
  ): Promise<void> {
    logger.info(`👥 Adding user ${userId} to project ${projectId} as ${role}`);

    await prisma.teamMembership.create({
      data: {
        userId,
        projectId,
        role: role as any,
      },
    });

    logger.info(`✅ User added to project successfully`);
  }

  static logTestStart(testName: string): void {
    logger.info(`🧪 Starting test: ${testName}`);
  }

  static logTestEnd(testName: string): void {
    logger.info(`✅ Test completed: ${testName}`);
  }

  static logApiCall(method: string, endpoint: string): void {
    logger.info(`🌐 API Call: ${method} ${endpoint}`);
  }

  static logResponse(status: number, message?: string): void {
    logger.info(`📡 Response: ${status} ${message || ''}`);
  }

  static logError(error: any): void {
    logger.error(`❌ Test Error: ${error.message}`);
  }
}