import request from 'supertest';
import { Express } from 'express';
import { prisma } from '../setup';
import { TestHelpers, TestUser, TestProject } from '../helpers/testHelpers';
import { createApp } from '../../src/app';
import logger from '../../src/utils/logger';

describe('🔔 Notification System', () => {
  let app: Express;
  let testUser: TestUser;
  let anotherUser: TestUser;
  let testProject: TestProject;

  beforeAll(async () => {
    app = createApp();
    logger.info('🚀 Notification test suite initialized');
  });

  beforeEach(async () => {
    testUser = await TestHelpers.createTestUser({
      name: 'Notification User',
      email: 'notifications@example.com',
    });

    anotherUser = await TestHelpers.createTestUser({
      name: 'Another User',
      email: 'another@example.com',
    });

    testProject = await TestHelpers.createTestProject(testUser.id);
    await TestHelpers.addUserToProject(anotherUser.id, testProject.id);
  });

  describe('Task Assignment Notifications', () => {
    it('should create notification when task is assigned', async () => {
      TestHelpers.logTestStart('Task Assignment Notification');

      const taskData = {
        title: 'Notification Test Task',
        description: 'Task to test notifications',
        projectId: testProject.id,
        assignedTo: anotherUser.id,
      };

      TestHelpers.logApiCall('POST', '/api/v1/tasks');

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(taskData)
        .expect(201);

      TestHelpers.logResponse(response.status, response.body.message);

      // Check if notification was created
      const notification = await prisma.notification.findFirst({
        where: {
          userId: anotherUser.id,
          type: 'TASK_ASSIGNED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(notification).toBeTruthy();
      expect(notification?.read).toBe(false);
      expect(notification?.message).toContain(taskData.title);

      TestHelpers.logTestEnd('Task Assignment Notification');
    });

    it('should not create notification when self-assigning task', async () => {
      TestHelpers.logTestStart('Self Assignment - No Notification');

      const taskData = {
        title: 'Self Assigned Task',
        projectId: testProject.id,
        assignedTo: testUser.id,
      };

      TestHelpers.logApiCall('POST', '/api/v1/tasks');

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(taskData)
        .expect(201);

      TestHelpers.logResponse(response.status, response.body.message);

      // Check that no notification was created
      const notification = await prisma.notification.findFirst({
        where: {
          userId: testUser.id,
          type: 'TASK_ASSIGNED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(notification).toBeNull();

      TestHelpers.logTestEnd('Self Assignment - No Notification');
    });
  });

  describe('Task Update Notifications', () => {
    it('should create notification when task status is updated', async () => {
      TestHelpers.logTestStart('Task Status Update Notification');

      // Create task assigned to another user
      const task = await TestHelpers.createTestTask(testProject.id, {
        title: 'Status Update Task',
        assignedTo: anotherUser.id,
      });

      // Update task status as project owner
      TestHelpers.logApiCall('PUT', `/api/v1/tasks/${task.id}`);

      const response = await request(app)
        .put(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      // Check if notification was created for the assignee
      const notification = await prisma.notification.findFirst({
        where: {
          userId: anotherUser.id,
          type: 'TASK_UPDATED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(notification).toBeTruthy();
      expect(notification?.message).toContain('IN_PROGRESS');

      TestHelpers.logTestEnd('Task Status Update Notification');
    });

    it('should create notification when task is reassigned', async () => {
      TestHelpers.logTestStart('Task Reassignment Notification');

      const thirdUser = await TestHelpers.createTestUser({
        email: 'third@example.com',
      });
      await TestHelpers.addUserToProject(thirdUser.id, testProject.id);

      // Create task assigned to second user
      const task = await TestHelpers.createTestTask(testProject.id, {
        assignedTo: anotherUser.id,
      });

      // Reassign to third user
      TestHelpers.logApiCall('PUT', `/api/v1/tasks/${task.id}`);

      const response = await request(app)
        .put(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ assignedTo: thirdUser.id })
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      // Check if notification was created for new assignee
      const notification = await prisma.notification.findFirst({
        where: {
          userId: thirdUser.id,
          type: 'TASK_ASSIGNED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(notification).toBeTruthy();

      TestHelpers.logTestEnd('Task Reassignment Notification');
    });
  });

  describe('Project Invitation Notifications', () => {
    it('should create notification when user is added to project', async () => {
      TestHelpers.logTestStart('Project Invitation Notification');

      const newUser = await TestHelpers.createTestUser({
        email: 'newmember@example.com',
      });

      TestHelpers.logApiCall('POST', `/api/v1/projects/${testProject.id}/members`);

      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/members`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          email: newUser.email,
          role: 'MEMBER',
        })
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      // Check if notification was created
      const notification = await prisma.notification.findFirst({
        where: {
          userId: newUser.id,
          type: 'PROJECT_INVITATION',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(notification).toBeTruthy();
      expect(notification?.message).toContain(testProject.name);

      TestHelpers.logTestEnd('Project Invitation Notification');
    });
  });

  describe('GET /api/v1/notifications', () => {
    beforeEach(async () => {
      // Create sample notifications
      await prisma.notification.createMany({
        data: [
          {
            type: 'TASK_ASSIGNED',
            message: 'You have been assigned to task "Test Task 1"',
            userId: testUser.id,
            read: false,
          },
          {
            type: 'TASK_UPDATED',
            message: 'Task "Test Task 2" status changed to IN_PROGRESS',
            userId: testUser.id,
            read: true,
          },
          {
            type: 'PROJECT_INVITATION',
            message: 'You have been added to project "Test Project"',
            userId: testUser.id,
            read: false,
          },
        ],
      });
    });

    it('should get all notifications for user', async () => {
      TestHelpers.logTestStart('Get Notifications - All');

      TestHelpers.logApiCall('GET', '/api/v1/notifications');

      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.meta.total).toBe(3);

      TestHelpers.logTestEnd('Get Notifications - All');
    });

    it('should filter unread notifications', async () => {
      TestHelpers.logTestStart('Get Notifications - Unread Only');

      TestHelpers.logApiCall('GET', '/api/v1/notifications?read=false');

      const response = await request(app)
        .get('/api/v1/notifications?read=false')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach((notification: any) => {
        expect(notification.read).toBe(false);
      });

      TestHelpers.logTestEnd('Get Notifications - Unread Only');
    });

    it('should paginate notifications', async () => {
      TestHelpers.logTestStart('Get Notifications - Pagination');

      // Create more notifications
      const additionalNotifications = Array.from({ length: 25 }, (_, i) => ({
        type: 'TASK_ASSIGNED',
        message: `Test notification ${i + 4}`,
        userId: testUser.id,
        read: false,
      }));

      await prisma.notification.createMany({
        data: additionalNotifications as any,
      });

      TestHelpers.logApiCall('GET', '/api/v1/notifications?page=2&limit=10');

      const response = await request(app)
        .get('/api/v1/notifications?page=2&limit=10')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.limit).toBe(10);
      expect(response.body.meta.total).toBe(28);

      TestHelpers.logTestEnd('Get Notifications - Pagination');
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      TestHelpers.logTestStart('Mark Notification as Read');

      const notification = await prisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          message: 'Test notification for marking read',
          userId: testUser.id,
          read: false,
        },
      });

      TestHelpers.logApiCall('PATCH', `/api/v1/notifications/${notification.id}/read`);

      const response = await request(app)
        .patch(`/api/v1/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data.read).toBe(true);

      // Verify in database
      const updatedNotification = await prisma.notification.findUnique({
        where: { id: notification.id },
      });
      expect(updatedNotification?.read).toBe(true);

      TestHelpers.logTestEnd('Mark Notification as Read');
    });

    it('should fail to mark another users notification as read', async () => {
      TestHelpers.logTestStart('Mark Notification - Wrong User');

      const notification = await prisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          message: 'Test notification for another user',
          userId: anotherUser.id,
          read: false,
        },
      });

      TestHelpers.logApiCall('PATCH', `/api/v1/notifications/${notification.id}/read`);

      const response = await request(app)
        .patch(`/api/v1/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(404);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);

      TestHelpers.logTestEnd('Mark Notification - Wrong User');
    });
  });

  describe('PATCH /api/v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      TestHelpers.logTestStart('Mark All Notifications as Read');

      // Create multiple unread notifications
      await prisma.notification.createMany({
        data: [
          {
            type: 'TASK_ASSIGNED',
            message: 'Unread notification 1',
            userId: testUser.id,
            read: false,
          },
          {
            type: 'TASK_ASSIGNED',
            message: 'Unread notification 2',
            userId: testUser.id,
            read: false,
          },
          {
            type: 'TASK_ASSIGNED',
            message: 'Already read notification',
            userId: testUser.id,
            read: true,
          },
        ],
      });

      TestHelpers.logApiCall('PATCH', '/api/v1/notifications/read-all');

      const response = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);

      // Verify all notifications are marked as read
      const unreadCount = await prisma.notification.count({
        where: {
          userId: testUser.id,
          read: false,
        },
      });
      expect(unreadCount).toBe(0);

      TestHelpers.logTestEnd('Mark All Notifications as Read');
    });
  });

  describe('Edge Cases', () => {
    it('should handle notification operations with invalid ID', async () => {
      TestHelpers.logTestStart('Invalid Notification ID');

      TestHelpers.logApiCall('PATCH', '/api/v1/notifications/invalid-id/read');

      const response = await request(app)
        .patch('/api/v1/notifications/invalid-id/read')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(400);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');

      TestHelpers.logTestEnd('Invalid Notification ID');
    });

    it('should return empty notifications for new user', async () => {
      TestHelpers.logTestStart('New User - Empty Notifications');

      const newUser = await TestHelpers.createTestUser({
        email: 'newuser@example.com',
      });

      TestHelpers.logApiCall('GET', '/api/v1/notifications');

      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${newUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.meta.total).toBe(0);

      TestHelpers.logTestEnd('New User - Empty Notifications');
    });
  });
});