import request from 'supertest';
import { Express } from 'express';
import { TestHelpers, TestUser, TestProject } from '../helpers/testHelpers';
import { createApp } from '../../src/app';
import logger from '../../src/utils/logger';

describe('🔄 Integration Tests - Complete User Workflows', () => {
  let app: Express;

  beforeAll(async () => {
    app = createApp();
    logger.info('🚀 Integration test suite initialized');
  });

  describe('Complete User Journey', () => {
    it('should complete full user journey: register → create project → add member → create tasks → manage notifications', async () => {
      TestHelpers.logTestStart('Complete User Journey');

      // 1. User Registration
      logger.info('📝 Step 1: User Registration');
      const userData = {
        name: 'John Doe',
        email: 'john@synergysphere.com',
        password: 'securePassword123',
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      const { accessToken: johnToken } = registerResponse.body.data;
      expect(johnToken).toBeDefined();

      // 2. Create Second User
      logger.info('📝 Step 2: Create Second User');
      const janeData = {
        name: 'Jane Smith',
        email: 'jane@synergysphere.com',
        password: 'securePassword456',
      };

      const janeRegisterResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(janeData)
        .expect(201);

      const { accessToken: janeToken } = janeRegisterResponse.body.data;

      // 3. John creates a project
      logger.info('📝 Step 3: Create Project');
      const projectData = {
        name: 'SynergySphere Mobile App',
        description: 'Development of the SynergySphere mobile application',
      };

      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${johnToken}`)
        .send(projectData)
        .expect(201);

      const project = projectResponse.body.data;
      expect(project.name).toBe(projectData.name);

      // 4. John adds Jane to the project
      logger.info('📝 Step 4: Add Team Member');
      const addMemberResponse = await request(app)
        .post(`/api/v1/projects/${project.id}/members`)
        .set('Authorization', `Bearer ${johnToken}`)
        .send({
          email: janeData.email,
          role: 'MEMBER',
        })
        .expect(200);

      expect(addMemberResponse.body.data.user.email).toBe(janeData.email);

      // 5. John creates tasks
      logger.info('📝 Step 5: Create Tasks');
      const tasks = [
        {
          title: 'Setup Project Structure',
          description: 'Initialize the project with proper folder structure',
          projectId: project.id,
          assignedTo: null, // Unassigned initially
        },
        {
          title: 'Design User Interface',
          description: 'Create wireframes and mockups for the app',
          projectId: project.id,
          assignedTo: null,
        },
        {
          title: 'Implement Authentication',
          description: 'Build user login and registration functionality',
          projectId: project.id,
          assignedTo: null,
        },
      ];

      const createdTasks = [];
      for (const taskData of tasks) {
        const taskResponse = await request(app)
          .post('/api/v1/tasks')
          .set('Authorization', `Bearer ${johnToken}`)
          .send(taskData)
          .expect(201);

        createdTasks.push(taskResponse.body.data);
      }

      expect(createdTasks).toHaveLength(3);

      // 6. Assign tasks to Jane
      logger.info('📝 Step 6: Assign Tasks');
      const janeUserId = janeRegisterResponse.body.data.user?.id || 
        (await request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${janeToken}`)
        ).body.data.id;

      // Assign first two tasks to Jane
      for (let i = 0; i < 2; i++) {
        await request(app)
          .put(`/api/v1/tasks/${createdTasks[i].id}`)
          .set('Authorization', `Bearer ${johnToken}`)
          .send({ assignedTo: janeUserId })
          .expect(200);
      }

      // 7. Jane views her tasks
      logger.info('📝 Step 7: View Assigned Tasks');
      const janeTasksResponse = await request(app)
        .get(`/api/v1/tasks?assignedTo=${janeUserId}`)
        .set('Authorization', `Bearer ${janeToken}`)
        .expect(200);

      expect(janeTasksResponse.body.data).toHaveLength(2);

      // 8. Jane updates task status
      logger.info('📝 Step 8: Update Task Status');
      const updateTaskResponse = await request(app)
        .patch(`/api/v1/tasks/${createdTasks[0].id}/status`)
        .set('Authorization', `Bearer ${janeToken}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(200);

      expect(updateTaskResponse.body.data.status).toBe('IN_PROGRESS');

      // 9. Check project overview
      logger.info('📝 Step 9: Project Overview');
      const projectOverviewResponse = await request(app)
        .get(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${johnToken}`)
        .expect(200);

      const projectOverview = projectOverviewResponse.body.data;
      expect(projectOverview.teamMemberships).toHaveLength(2); // John + Jane
      expect(projectOverview._count.tasks).toBe(3);

      // 10. Get all projects for John
      logger.info('📝 Step 10: List User Projects');
      const projectsResponse = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${johnToken}`)
        .expect(200);

      expect(projectsResponse.body.data).toHaveLength(1);
      expect(projectsResponse.body.data[0].id).toBe(project.id);

      // 11. Complete task workflow
      logger.info('📝 Step 11: Complete Task Workflow');
      await request(app)
        .patch(`/api/v1/tasks/${createdTasks[0].id}/status`)
        .set('Authorization', `Bearer ${janeToken}`)
        .send({ status: 'DONE' })
        .expect(200);

      // 12. Verify final state
      logger.info('📝 Step 12: Verify Final State');
      const finalTasksResponse = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${johnToken}`)
        .expect(200);

      const finalTasks = finalTasksResponse.body.data;
      expect(finalTasks).toHaveLength(3);
      
      const completedTask = finalTasks.find((t: any) => t.status === 'DONE');
      const inProgressTask = finalTasks.find((t: any) => t.status === 'IN_PROGRESS');
      const todoTask = finalTasks.find((t: any) => t.status === 'TODO');
      
      expect(completedTask).toBeTruthy();
      expect(inProgressTask).toBeTruthy();
      expect(todoTask).toBeTruthy();

      TestHelpers.logTestEnd('Complete User Journey');
      logger.info('✅ Complete user journey test completed successfully');
    });

    it('should handle collaborative task management workflow', async () => {
      TestHelpers.logTestStart('Collaborative Task Management');

      // Setup users
      const owner = await TestHelpers.createTestUser({
        name: 'Project Owner',
        email: 'owner@collaborative.com',
      });

      const developer = await TestHelpers.createTestUser({
        name: 'Developer',
        email: 'dev@collaborative.com',
      });

      const designer = await TestHelpers.createTestUser({
        name: 'Designer',
        email: 'designer@collaborative.com',
      });

      // Create project
      const project = await TestHelpers.createTestProject(owner.id, {
        name: 'Collaborative Project',
      });

      // Add team members
      await request(app)
        .post(`/api/v1/projects/${project.id}/members`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ email: developer.email, role: 'MEMBER' })
        .expect(200);

      await request(app)
        .post(`/api/v1/projects/${project.id}/members`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ email: designer.email, role: 'ADMIN' })
        .expect(200);

      // Create tasks with different assignments
      const tasks = [
        { title: 'Backend API Development', assignedTo: developer.id },
        { title: 'UI/UX Design', assignedTo: designer.id },
        { title: 'Integration Testing', assignedTo: null }, // Unassigned
      ];

      const createdTasks = [];
      for (const task of tasks) {
        const response = await request(app)
          .post('/api/v1/tasks')
          .set('Authorization', `Bearer ${owner.token}`)
          .send({
            title: task.title,
            projectId: project.id,
            assignedTo: task.assignedTo,
          })
          .expect(201);

        createdTasks.push(response.body.data);
      }

      // Developer works on their task
      await request(app)
        .patch(`/api/v1/tasks/${createdTasks[0].id}/status`)
        .set('Authorization', `Bearer ${developer.token}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(200);

      // Designer completes their task
      await request(app)
        .patch(`/api/v1/tasks/${createdTasks[1].id}/status`)
        .set('Authorization', `Bearer ${designer.token}`)
        .send({ status: 'DONE' })
        .expect(200);

      // Owner assigns the integration testing task
      await request(app)
        .put(`/api/v1/tasks/${createdTasks[2].id}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ 
          assignedTo: developer.id,
          description: 'Test the integration between backend and frontend',
        })
        .expect(200);

      // Verify final task distribution
      const finalProjectResponse = await request(app)
        .get(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .expect(200);

      expect(finalProjectResponse.body.data._count.tasks).toBe(3);
      expect(finalProjectResponse.body.data.teamMemberships).toHaveLength(3);

      TestHelpers.logTestEnd('Collaborative Task Management');
    });

    it('should handle project lifecycle with member permissions', async () => {
      TestHelpers.logTestStart('Project Lifecycle with Permissions');

      // Create users with different roles
      const owner = await TestHelpers.createTestUser({
        email: 'projectowner@lifecycle.com',
      });

      const admin = await TestHelpers.createTestUser({
        email: 'projectadmin@lifecycle.com',
      });

      const member = await TestHelpers.createTestUser({
        email: 'projectmember@lifecycle.com',
      });

      // Owner creates project
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          name: 'Permission Test Project',
          description: 'Testing permission levels',
        })
        .expect(201);

      const project = projectResponse.body.data;

      // Add admin and member
      await request(app)
        .post(`/api/v1/projects/${project.id}/members`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ email: admin.email, role: 'ADMIN' })
        .expect(200);

      await request(app)
        .post(`/api/v1/projects/${project.id}/members`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ email: member.email, role: 'MEMBER' })
        .expect(200);

      // Test admin can update project
      await request(app)
        .put(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ name: 'Updated Project Name' })
        .expect(200);

      // Test member cannot update project
      await request(app)
        .put(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ name: 'Should Not Work' })
        .expect(403);

      // Test admin can add members
      const newMember = await TestHelpers.createTestUser({
        email: 'newmember@lifecycle.com',
      });

      await request(app)
        .post(`/api/v1/projects/${project.id}/members`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ email: newMember.email, role: 'MEMBER' })
        .expect(200);

      // Test member cannot add members
      const anotherUser = await TestHelpers.createTestUser({
        email: 'another@lifecycle.com',
      });

      await request(app)
        .post(`/api/v1/projects/${project.id}/members`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ email: anotherUser.email, role: 'MEMBER' })
        .expect(403);

      // Test only owner can delete project
      await request(app)
        .delete(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(403);

      await request(app)
        .delete(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .expect(200);

      TestHelpers.logTestEnd('Project Lifecycle with Permissions');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle cascade deletions properly', async () => {
      TestHelpers.logTestStart('Cascade Deletion Handling');

      const owner = await TestHelpers.createTestUser({
        email: 'cascade@test.com',
      });

      const project = await TestHelpers.createTestProject(owner.id);
      
      // Create tasks in the project
      for (let i = 1; i <= 3; i++) {
        await TestHelpers.createTestTask(project.id, {
          title: `Task ${i}`,
        });
      }

      // Verify tasks exist
      const tasksResponse = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${owner.token}`)
        .expect(200);

      expect(tasksResponse.body.data).toHaveLength(3);

      // Delete project - should cascade delete tasks
      await request(app)
        .delete(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .expect(200);

      // Verify tasks are also deleted
      const tasksAfterDeletionResponse = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${owner.token}`)
        .expect(200);

      expect(tasksAfterDeletionResponse.body.data).toHaveLength(0);

      TestHelpers.logTestEnd('Cascade Deletion Handling');
    });

    it('should handle concurrent operations gracefully', async () => {
      TestHelpers.logTestStart('Concurrent Operations');

      const user = await TestHelpers.createTestUser({
        email: 'concurrent@test.com',
      });

      const project = await TestHelpers.createTestProject(user.id);

      // Simulate concurrent task creation
      const taskPromises = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/v1/tasks')
          .set('Authorization', `Bearer ${user.token}`)
          .send({
            title: `Concurrent Task ${i + 1}`,
            projectId: project.id,
          })
      );

      const results = await Promise.all(taskPromises);
      
      // All tasks should be created successfully
      results.forEach(result => {
        expect(result.status).toBe(201);
      });

      // Verify all tasks were created
      const tasksResponse = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(tasksResponse.body.data).toHaveLength(10);

      TestHelpers.logTestEnd('Concurrent Operations');
    });

    it('should maintain data consistency under stress', async () => {
      TestHelpers.logTestStart('Data Consistency Stress Test');

      const users = [];
      for (let i = 1; i <= 5; i++) {
        users.push(await TestHelpers.createTestUser({
          email: `stressuser${i}@test.com`,
        }));
      }

      const project = await TestHelpers.createTestProject(users[0].id);

      // Add all users to the project
      for (let i = 1; i < users.length; i++) {
        await request(app)
          .post(`/api/v1/projects/${project.id}/members`)
          .set('Authorization', `Bearer ${users[0].token}`)
          .send({ email: users[i].email, role: 'MEMBER' })
          .expect(200);
      }

      // Each user creates tasks and updates them concurrently
      const operations = [];
      
      for (let i = 0; i < users.length; i++) {
        // Create task
        operations.push(
          request(app)
            .post('/api/v1/tasks')
            .set('Authorization', `Bearer ${users[i].token}`)
            .send({
              title: `Stress Task from User ${i + 1}`,
              projectId: project.id,
            })
        );
      }

      const createResults = await Promise.all(operations);
      const createdTasks = createResults.map(r => r.body.data);

      // Now each user updates a different task's status
      const updateOperations = createdTasks.map((task, i) =>
        request(app)
          .patch(`/api/v1/tasks/${task.id}/status`)
          .set('Authorization', `Bearer ${users[i].token}`)
          .send({ status: 'IN_PROGRESS' })
      );

      const updateResults = await Promise.all(updateOperations);
      updateResults.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body.data.status).toBe('IN_PROGRESS');
      });

      // Verify final state
      const finalTasksResponse = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${users[0].token}`)
        .expect(200);

      expect(finalTasksResponse.body.data).toHaveLength(5);
      finalTasksResponse.body.data.forEach((task: any) => {
        expect(task.status).toBe('IN_PROGRESS');
      });

      TestHelpers.logTestEnd('Data Consistency Stress Test');
    });
  });
});