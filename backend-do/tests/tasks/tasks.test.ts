import request from 'supertest';
import { Express } from 'express';
import { prisma } from '../setup';
import { TestHelpers, TestUser, TestProject } from '../helpers/testHelpers';
import { createApp } from '../../src/app';
import logger from '../../src/utils/logger';

describe('✅ Task Endpoints', () => {
  let app: Express;
  let testUser: TestUser;
  let anotherUser: TestUser;
  let testProject: TestProject;

  beforeAll(async () => {
    app = createApp();
    logger.info('🚀 Task test suite initialized');
  });

  beforeEach(async () => {
    testUser = await TestHelpers.createTestUser({
      name: 'Task Owner',
      email: 'taskowner@example.com',
    });

    anotherUser = await TestHelpers.createTestUser({
      name: 'Task Assignee',
      email: 'assignee@example.com',
    });

    testProject = await TestHelpers.createTestProject(testUser.id, {
      name: 'Task Test Project',
    });

    // Add another user to the project
    await TestHelpers.addUserToProject(anotherUser.id, testProject.id, 'MEMBER');
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a task successfully', async () => {
      TestHelpers.logTestStart('Create Task - Success');

      const taskData = {
        title: 'Test Task',
        description: 'A task for testing purposes',
        projectId: testProject.id,
        assignedTo: anotherUser.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      };

      TestHelpers.logApiCall('POST', '/api/v1/tasks');

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(taskData)
        .expect(201);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.description).toBe(taskData.description);
      expect(response.body.data.projectId).toBe(taskData.projectId);
      expect(response.body.data.assignedTo).toBe(taskData.assignedTo);
      expect(response.body.data.status).toBe('TODO');

      // Verify notification was created for assignee
      const notification = await prisma.notification.findFirst({
        where: {
          userId: anotherUser.id,
          type: 'TASK_ASSIGNED',
        },
      });
      expect(notification).toBeTruthy();

      TestHelpers.logTestEnd('Create Task - Success');
    });

    it('should create task without assignee', async () => {
      TestHelpers.logTestStart('Create Task - No Assignee');

      const taskData = {
        title: 'Unassigned Task',
        description: 'A task without assignee',
        projectId: testProject.id,
      };

      TestHelpers.logApiCall('POST', '/api/v1/tasks');

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(taskData)
        .expect(201);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assignedTo).toBeNull();

      TestHelpers.logTestEnd('Create Task - No Assignee');
    });

    it('should fail to create task for non-member project', async () => {
      TestHelpers.logTestStart('Create Task - Not Project Member');

      const outsiderUser = await TestHelpers.createTestUser({
        email: 'outsider@example.com',
      });

      const taskData = {
        title: 'Should Fail',
        projectId: testProject.id,
      };

      TestHelpers.logApiCall('POST', '/api/v1/tasks');

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${outsiderUser.token}`)
        .send(taskData)
        .expect(400);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You are not a member of this project');

      TestHelpers.logTestEnd('Create Task - Not Project Member');
    });

    it('should fail to assign task to non-member', async () => {
      TestHelpers.logTestStart('Create Task - Assign to Non-member');

      const outsiderUser = await TestHelpers.createTestUser({
        email: 'nonmember@example.com',
      });

      const taskData = {
        title: 'Assignment Test',
        projectId: testProject.id,
        assignedTo: outsiderUser.id,
      };

      TestHelpers.logApiCall('POST', '/api/v1/tasks');

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(taskData)
        .expect(400);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Assigned user is not a member of this project');

      TestHelpers.logTestEnd('Create Task - Assign to Non-member');
    });

    it('should fail to create task with invalid data', async () => {
      TestHelpers.logTestStart('Create Task - Invalid Data');

      TestHelpers.logApiCall('POST', '/api/v1/tasks');

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          // Missing required fields
          description: 'Task without title',
        })
        .expect(400);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');

      TestHelpers.logTestEnd('Create Task - Invalid Data');
    });
  });

  describe('GET /api/v1/tasks', () => {
    beforeEach(async () => {
      // Create sample tasks
      await TestHelpers.createTestTask(testProject.id, {
        title: 'Task 1',
        status: 'TODO',
        assignedTo: testUser.id,
      });

      await TestHelpers.createTestTask(testProject.id, {
        title: 'Task 2',
        status: 'IN_PROGRESS',
        assignedTo: anotherUser.id,
      });

      await TestHelpers.createTestTask(testProject.id, {
        title: 'Task 3',
        status: 'DONE',
      });
    });

    it('should get all tasks for user', async () => {
      TestHelpers.logTestStart('Get Tasks - Success');

      TestHelpers.logApiCall('GET', '/api/v1/tasks');

      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.meta.total).toBe(3);

      TestHelpers.logTestEnd('Get Tasks - Success');
    });

    it('should filter tasks by project', async () => {
      TestHelpers.logTestStart('Get Tasks - Filter by Project');

      TestHelpers.logApiCall('GET', `/api/v1/tasks?projectId=${testProject.id}`);

      const response = await request(app)
        .get(`/api/v1/tasks?projectId=${testProject.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      response.body.data.forEach((task: any) => {
        expect(task.projectId).toBe(testProject.id);
      });

      TestHelpers.logTestEnd('Get Tasks - Filter by Project');
    });

    it('should filter tasks by status', async () => {
      TestHelpers.logTestStart('Get Tasks - Filter by Status');

      TestHelpers.logApiCall('GET', '/api/v1/tasks?status=TODO');

      const response = await request(app)
        .get('/api/v1/tasks?status=TODO')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('TODO');

      TestHelpers.logTestEnd('Get Tasks - Filter by Status');
    });

    it('should filter tasks by assignee', async () => {
      TestHelpers.logTestStart('Get Tasks - Filter by Assignee');

      TestHelpers.logApiCall('GET', `/api/v1/tasks?assignedTo=${anotherUser.id}`);

      const response = await request(app)
        .get(`/api/v1/tasks?assignedTo=${anotherUser.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].assignedTo).toBe(anotherUser.id);

      TestHelpers.logTestEnd('Get Tasks - Filter by Assignee');
    });

    it('should paginate tasks', async () => {
      TestHelpers.logTestStart('Get Tasks - Pagination');

      // Create more tasks for pagination test
      for (let i = 4; i <= 12; i++) {
        await TestHelpers.createTestTask(testProject.id, {
          title: `Task ${i}`,
        });
      }

      TestHelpers.logApiCall('GET', '/api/v1/tasks?page=2&limit=5');

      const response = await request(app)
        .get('/api/v1/tasks?page=2&limit=5')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.limit).toBe(5);
      expect(response.body.meta.total).toBe(12);

      TestHelpers.logTestEnd('Get Tasks - Pagination');
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    it('should get task details successfully', async () => {
      TestHelpers.logTestStart('Get Task Details - Success');

      const task = await TestHelpers.createTestTask(testProject.id, {
        title: 'Detailed Task',
        description: 'Task with full details',
        assignedTo: anotherUser.id,
      });

      TestHelpers.logApiCall('GET', `/api/v1/tasks/${task.id}`);

      const response = await request(app)
        .get(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(task.id);
      expect(response.body.data.title).toBe(task.title);
      expect(response.body.data.project).toBeDefined();
      expect(response.body.data.assignee).toBeDefined();

      TestHelpers.logTestEnd('Get Task Details - Success');
    });

    it('should fail to get task from non-member project', async () => {
      TestHelpers.logTestStart('Get Task Details - Not Project Member');

      const outsiderUser = await TestHelpers.createTestUser({
        email: 'outsider@example.com',
      });

      const task = await TestHelpers.createTestTask(testProject.id);

      TestHelpers.logApiCall('GET', `/api/v1/tasks/${task.id}`);

      const response = await request(app)
        .get(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer ${outsiderUser.token}`)
        .expect(404);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Task not found');

      TestHelpers.logTestEnd('Get Task Details - Not Project Member');
    });
  });

  describe('PUT /api/v1/tasks/:id', () => {
    it('should update task successfully', async () => {
      TestHelpers.logTestStart('Update Task - Success');

      const task = await TestHelpers.createTestTask(testProject.id, {
        title: 'Original Task',
        assignedTo: testUser.id,
      });

      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated description',
        status: 'IN_PROGRESS',
        assignedTo: anotherUser.id,
      };

      TestHelpers.logApiCall('PUT', `/api/v1/tasks/${task.id}`);

      const response = await request(app)
        .put(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(updateData)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.assignedTo).toBe(updateData.assignedTo);

      // Check if notifications were created
      const assignmentNotification = await prisma.notification.findFirst({
        where: {
          userId: anotherUser.id,
          type: 'TASK_ASSIGNED',
        },
      });
      expect(assignmentNotification).toBeTruthy();

      const statusNotification = await prisma.notification.findFirst({
        where: {
          userId: testUser.id, // Original assignee
          type: 'TASK_UPDATED',
        },
      });
      expect(statusNotification).toBeTruthy();

      TestHelpers.logTestEnd('Update Task - Success');
    });

    it('should update task status only', async () => {
      TestHelpers.logTestStart('Update Task Status - Success');

      const task = await TestHelpers.createTestTask(testProject.id, {
        status: 'TODO',
        assignedTo: testUser.id,
      });

      TestHelpers.logApiCall('PATCH', `/api/v1/tasks/${task.id}/status`);

      const response = await request(app)
        .patch(`/api/v1/tasks/${task.id}/status`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ status: 'DONE' })
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('DONE');

      TestHelpers.logTestEnd('Update Task Status - Success');
    });

    it('should fail to assign task to non-member', async () => {
      TestHelpers.logTestStart('Update Task - Assign to Non-member');

      const task = await TestHelpers.createTestTask(testProject.id);
      const outsider = await TestHelpers.createTestUser({
        email: 'outsider@example.com',
      });

      TestHelpers.logApiCall('PUT', `/api/v1/tasks/${task.id}`);

      const response = await request(app)
        .put(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ assignedTo: outsider.id })
        .expect(400);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Assigned user is not a member of this project');

      TestHelpers.logTestEnd('Update Task - Assign to Non-member');
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    it('should delete task as project owner', async () => {
      TestHelpers.logTestStart('Delete Task - As Owner');

      const task = await TestHelpers.createTestTask(testProject.id, {
        assignedTo: anotherUser.id,
      });

      TestHelpers.logApiCall('DELETE', `/api/v1/tasks/${task.id}`);

      const response = await request(app)
        .delete(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task deleted successfully');

      // Verify task was deleted
      const deletedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });
      expect(deletedTask).toBeNull();

      TestHelpers.logTestEnd('Delete Task - As Owner');
    });

    it('should delete task as assignee', async () => {
      TestHelpers.logTestStart('Delete Task - As Assignee');

      const task = await TestHelpers.createTestTask(testProject.id, {
        assignedTo: anotherUser.id,
      });

      TestHelpers.logApiCall('DELETE', `/api/v1/tasks/${task.id}`);

      const response = await request(app)
        .delete(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer ${anotherUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);

      TestHelpers.logTestEnd('Delete Task - As Assignee');
    });

    it('should fail to delete task without permission', async () => {
      TestHelpers.logTestStart('Delete Task - No Permission');

      const task = await TestHelpers.createTestTask(testProject.id, {
        assignedTo: testUser.id,
      });

      // Regular member trying to delete task not assigned to them
      TestHelpers.logApiCall('DELETE', `/api/v1/tasks/${task.id}`);

      const response = await request(app)
        .delete(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer ${anotherUser.token}`)
        .expect(403);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions to delete this task');

      TestHelpers.logTestEnd('Delete Task - No Permission');
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid task ID format', async () => {
      TestHelpers.logTestStart('Invalid Task ID Format');

      TestHelpers.logApiCall('GET', '/api/v1/tasks/invalid-id');

      const response = await request(app)
        .get('/api/v1/tasks/invalid-id')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(400);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');

      TestHelpers.logTestEnd('Invalid Task ID Format');
    });

    it('should handle invalid status values', async () => {
      TestHelpers.logTestStart('Invalid Status Value');

      const task = await TestHelpers.createTestTask(testProject.id);

      TestHelpers.logApiCall('PATCH', `/api/v1/tasks/${task.id}/status`);

      const response = await request(app)
        .patch(`/api/v1/tasks/${task.id}/status`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');

      TestHelpers.logTestEnd('Invalid Status Value');
    });

    it('should handle task operations when user has no projects', async () => {
      TestHelpers.logTestStart('No Projects - Get Tasks');

      const orphanUser = await TestHelpers.createTestUser({
        email: 'orphan@example.com',
      });

      TestHelpers.logApiCall('GET', '/api/v1/tasks');

      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${orphanUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.meta.total).toBe(0);

      TestHelpers.logTestEnd('No Projects - Get Tasks');
    });
  });
});