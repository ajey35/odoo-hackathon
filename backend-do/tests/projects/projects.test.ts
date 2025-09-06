import request from 'supertest';
import { Express } from 'express';
import { prisma } from '../setup';
import { TestHelpers, TestUser } from '../helpers/testHelpers';
import { createApp } from '../../src/app';
import logger from '../../src/utils/logger';

describe('🏗️ Project Endpoints', () => {
  let app: Express;
  let testUser: TestUser;
  let anotherUser: TestUser;

  beforeAll(async () => {
    app = createApp();
    logger.info('🚀 Project test suite initialized');
  });

  beforeEach(async () => {
    testUser = await TestHelpers.createTestUser({
      name: 'Project Owner',
      email: 'owner@example.com',
    });

    anotherUser = await TestHelpers.createTestUser({
      name: 'Another User',
      email: 'another@example.com',
    });
  });

  describe('POST /api/v1/projects', () => {
    it('should create a project successfully', async () => {
      TestHelpers.logTestStart('Create Project - Success');

      const projectData = {
        name: 'Test Project',
        description: 'A project for testing purposes',
      };

      TestHelpers.logApiCall('POST', '/api/v1/projects');

      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(projectData)
        .expect(201);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(projectData.name);
      expect(response.body.data.description).toBe(projectData.description);
      expect(response.body.data.ownerId).toBe(testUser.id);
      expect(response.body.message).toBe('Project created successfully');

      // Verify owner is automatically added as team member
      const membership = await prisma.teamMembership.findFirst({
        where: {
          projectId: response.body.data.id,
          userId: testUser.id,
          role: 'OWNER',
        },
      });
      expect(membership).toBeTruthy();

      TestHelpers.logTestEnd('Create Project - Success');
    });

    it('should fail to create project without authentication', async () => {
      TestHelpers.logTestStart('Create Project - No Auth');

      TestHelpers.logApiCall('POST', '/api/v1/projects');

      const response = await request(app)
        .post('/api/v1/projects')
        .send({
          name: 'Test Project',
          description: 'A project for testing',
        })
        .expect(401);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No valid token provided');

      TestHelpers.logTestEnd('Create Project - No Auth');
    });

    it('should fail to create project with invalid data', async () => {
      TestHelpers.logTestStart('Create Project - Invalid Data');

      TestHelpers.logApiCall('POST', '/api/v1/projects');

      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'A', // Too short
        })
        .expect(400);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');

      TestHelpers.logTestEnd('Create Project - Invalid Data');
    });
  });

  describe('GET /api/v1/projects', () => {
    it('should get user projects successfully', async () => {
      TestHelpers.logTestStart('Get Projects - Success');

      // Create multiple projects
      const project1 = await TestHelpers.createTestProject(testUser.id, {
        name: 'Project 1',
      });
      const project2 = await TestHelpers.createTestProject(testUser.id, {
        name: 'Project 2',
      });

      TestHelpers.logApiCall('GET', '/api/v1/projects');

      const response = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.total).toBe(2);
      expect(response.body.meta.page).toBe(1);

      TestHelpers.logTestEnd('Get Projects - Success');
    });

    it('should get projects with pagination', async () => {
      TestHelpers.logTestStart('Get Projects - Pagination');

      // Create multiple projects
      for (let i = 1; i <= 15; i++) {
        await TestHelpers.createTestProject(testUser.id, {
          name: `Project ${i}`,
        });
      }

      TestHelpers.logApiCall('GET', '/api/v1/projects?page=2&limit=5');

      const response = await request(app)
        .get('/api/v1/projects?page=2&limit=5')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.limit).toBe(5);
      expect(response.body.meta.total).toBe(15);
      expect(response.body.meta.totalPages).toBe(3);

      TestHelpers.logTestEnd('Get Projects - Pagination');
    });

    it('should return empty array when user has no projects', async () => {
      TestHelpers.logTestStart('Get Projects - Empty');

      TestHelpers.logApiCall('GET', '/api/v1/projects');

      const response = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.meta.total).toBe(0);

      TestHelpers.logTestEnd('Get Projects - Empty');
    });
  });

  describe('GET /api/v1/projects/:id', () => {
    it('should get project details successfully', async () => {
      TestHelpers.logTestStart('Get Project Details - Success');

      const project = await TestHelpers.createTestProject(testUser.id, {
        name: 'Detailed Project',
        description: 'Project with details',
      });

      TestHelpers.logApiCall('GET', `/api/v1/projects/${project.id}`);

      const response = await request(app)
        .get(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(project.id);
      expect(response.body.data.name).toBe(project.name);
      expect(response.body.data.description).toBe(project.description);
      expect(response.body.data.teamMemberships).toBeDefined();

      TestHelpers.logTestEnd('Get Project Details - Success');
    });

    it('should fail to get project user is not member of', async () => {
      TestHelpers.logTestStart('Get Project Details - Not Member');

      const project = await TestHelpers.createTestProject(anotherUser.id);

      TestHelpers.logApiCall('GET', `/api/v1/projects/${project.id}`);

      const response = await request(app)
        .get(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(404);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Project not found');

      TestHelpers.logTestEnd('Get Project Details - Not Member');
    });

    it('should fail to get non-existent project', async () => {
      TestHelpers.logTestStart('Get Project Details - Not Found');

      const fakeProjectId = 'clw1a1b2c3d4e5f6g7h8i9j0k';

      TestHelpers.logApiCall('GET', `/api/v1/projects/${fakeProjectId}`);

      const response = await request(app)
        .get(`/api/v1/projects/${fakeProjectId}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(404);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Project not found');

      TestHelpers.logTestEnd('Get Project Details - Not Found');
    });
  });

  describe('PUT /api/v1/projects/:id', () => {
    it('should update project successfully as owner', async () => {
      TestHelpers.logTestStart('Update Project - Success');

      const project = await TestHelpers.createTestProject(testUser.id);

      const updateData = {
        name: 'Updated Project Name',
        description: 'Updated description',
      };

      TestHelpers.logApiCall('PUT', `/api/v1/projects/${project.id}`);

      const response = await request(app)
        .put(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(updateData)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);

      TestHelpers.logTestEnd('Update Project - Success');
    });

    it('should fail to update project as regular member', async () => {
      TestHelpers.logTestStart('Update Project - Insufficient Permission');

      const project = await TestHelpers.createTestProject(anotherUser.id);
      await TestHelpers.addUserToProject(testUser.id, project.id, 'MEMBER');

      TestHelpers.logApiCall('PUT', `/api/v1/projects/${project.id}`);

      const response = await request(app)
        .put(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          name: 'Should not update',
        })
        .expect(403);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions');

      TestHelpers.logTestEnd('Update Project - Insufficient Permission');
    });
  });

  describe('DELETE /api/v1/projects/:id', () => {
    it('should delete project successfully as owner', async () => {
      TestHelpers.logTestStart('Delete Project - Success');

      const project = await TestHelpers.createTestProject(testUser.id);

      TestHelpers.logApiCall('DELETE', `/api/v1/projects/${project.id}`);

      const response = await request(app)
        .delete(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project deleted successfully');

      // Verify project is deleted
      const deletedProject = await prisma.project.findUnique({
        where: { id: project.id },
      });
      expect(deletedProject).toBeNull();

      TestHelpers.logTestEnd('Delete Project - Success');
    });

    it('should fail to delete project as non-owner', async () => {
      TestHelpers.logTestStart('Delete Project - Not Owner');

      const project = await TestHelpers.createTestProject(anotherUser.id);

      TestHelpers.logApiCall('DELETE', `/api/v1/projects/${project.id}`);

      const response = await request(app)
        .delete(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(403);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Only project owner can delete the project');

      TestHelpers.logTestEnd('Delete Project - Not Owner');
    });
  });

  describe('POST /api/v1/projects/:id/members', () => {
    it('should add member successfully as owner', async () => {
      TestHelpers.logTestStart('Add Member - Success');

      const project = await TestHelpers.createTestProject(testUser.id);

      const memberData = {
        email: anotherUser.email,
        role: 'MEMBER',
      };

      TestHelpers.logApiCall('POST', `/api/v1/projects/${project.id}/members`);

      const response = await request(app)
        .post(`/api/v1/projects/${project.id}/members`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(memberData)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(anotherUser.email);
      expect(response.body.data.role).toBe('MEMBER');

      // Verify membership was created
      const membership = await prisma.teamMembership.findFirst({
        where: {
          projectId: project.id,
          userId: anotherUser.id,
        },
      });
      expect(membership).toBeTruthy();

      TestHelpers.logTestEnd('Add Member - Success');
    });

    it('should fail to add non-existent user', async () => {
      TestHelpers.logTestStart('Add Member - User Not Found');

      const project = await TestHelpers.createTestProject(testUser.id);

      TestHelpers.logApiCall('POST', `/api/v1/projects/${project.id}/members`);

      const response = await request(app)
        .post(`/api/v1/projects/${project.id}/members`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          email: 'nonexistent@example.com',
          role: 'MEMBER',
        })
        .expect(404);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');

      TestHelpers.logTestEnd('Add Member - User Not Found');
    });

    it('should fail to add already existing member', async () => {
      TestHelpers.logTestStart('Add Member - Already Member');

      const project = await TestHelpers.createTestProject(testUser.id);
      await TestHelpers.addUserToProject(anotherUser.id, project.id);

      TestHelpers.logApiCall('POST', `/api/v1/projects/${project.id}/members`);

      const response = await request(app)
        .post(`/api/v1/projects/${project.id}/members`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          email: anotherUser.email,
          role: 'MEMBER',
        })
        .expect(409);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User is already a member of this project');

      TestHelpers.logTestEnd('Add Member - Already Member');
    });
  });

  describe('DELETE /api/v1/projects/:id/members/:userId', () => {
    it('should remove member successfully as owner', async () => {
      TestHelpers.logTestStart('Remove Member - Success');

      const project = await TestHelpers.createTestProject(testUser.id);
      await TestHelpers.addUserToProject(anotherUser.id, project.id);

      TestHelpers.logApiCall('DELETE', `/api/v1/projects/${project.id}/members/${anotherUser.id}`);

      const response = await request(app)
        .delete(`/api/v1/projects/${project.id}/members/${anotherUser.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Member removed successfully');

      // Verify membership was deleted
      const membership = await prisma.teamMembership.findFirst({
        where: {
          projectId: project.id,
          userId: anotherUser.id,
        },
      });
      expect(membership).toBeNull();

      TestHelpers.logTestEnd('Remove Member - Success');
    });

    it('should fail to remove project owner', async () => {
      TestHelpers.logTestStart('Remove Member - Cannot Remove Owner');

      const project = await TestHelpers.createTestProject(testUser.id);

      TestHelpers.logApiCall('DELETE', `/api/v1/projects/${project.id}/members/${testUser.id}`);

      const response = await request(app)
        .delete(`/api/v1/projects/${project.id}/members/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(400);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot remove project owner');

      TestHelpers.logTestEnd('Remove Member - Cannot Remove Owner');
    });
  });
});