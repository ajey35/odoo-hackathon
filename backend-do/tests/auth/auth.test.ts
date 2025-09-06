import request from 'supertest';
import { Express } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../setup';
import { TestHelpers } from '../helpers/testHelpers';
// import { createApp } from '../../src/app';
import logger from '../../src/utils/logger';

// Jest types are available globally through tsconfig.json

describe('🔐 Authentication Endpoints', () => {
  let app: Express;

  beforeAll(async () => {
    app = createApp();
        logger.info('🚀 Auth test suite initialized');
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      TestHelpers.logTestStart('User Registration - Success');
      
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      TestHelpers.logApiCall('POST', '/api/v1/auth/register');

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.message).toBe('Registration successful');

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).toBeTruthy();
      expect(user?.name).toBe(userData.name);

      TestHelpers.logTestEnd('User Registration - Success');
    });

    it('should fail to register with duplicate email', async () => {
      TestHelpers.logTestStart('User Registration - Duplicate Email');

      const userData = {
        name: 'Jane Doe',
        email: 'duplicate@example.com',
        password: 'password123',
      };

      // Create user first
      await TestHelpers.createTestUser(userData);

      TestHelpers.logApiCall('POST', '/api/v1/auth/register');

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already exists');

      TestHelpers.logTestEnd('User Registration - Duplicate Email');
    });

    it('should fail to register with invalid data', async () => {
      TestHelpers.logTestStart('User Registration - Invalid Data');

      const invalidData = {
        name: 'A', // Too short
        email: 'invalid-email', // Invalid format
        password: '123', // Too short
      };

      TestHelpers.logApiCall('POST', '/api/v1/auth/register');

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);

      TestHelpers.logTestEnd('User Registration - Invalid Data');
    });

    it('should fail to register with missing fields', async () => {
      TestHelpers.logTestStart('User Registration - Missing Fields');

      TestHelpers.logApiCall('POST', '/api/v1/auth/register');

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({})
        .expect(400);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');

      TestHelpers.logTestEnd('User Registration - Missing Fields');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      TestHelpers.logTestStart('User Login - Success');

      const userData = {
        name: 'Login Test User',
        email: 'login@example.com',
        password: 'password123',
      };

      await TestHelpers.createTestUser(userData);

      TestHelpers.logApiCall('POST', '/api/v1/auth/login');

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.message).toBe('Login successful');

      TestHelpers.logTestEnd('User Login - Success');
    });

    it('should fail login with invalid email', async () => {
      TestHelpers.logTestStart('User Login - Invalid Email');

      TestHelpers.logApiCall('POST', '/api/v1/auth/login');

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');

      TestHelpers.logTestEnd('User Login - Invalid Email');
    });

    it('should fail login with invalid password', async () => {
      TestHelpers.logTestStart('User Login - Invalid Password');

      const userData = {
        name: 'Password Test User',
        email: 'password@example.com',
        password: 'correctPassword',
      };

      await TestHelpers.createTestUser(userData);

      TestHelpers.logApiCall('POST', '/api/v1/auth/login');

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: 'wrongPassword',
        })
        .expect(401);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');

      TestHelpers.logTestEnd('User Login - Invalid Password');
    });

    it('should fail login with invalid data format', async () => {
      TestHelpers.logTestStart('User Login - Invalid Format');

      TestHelpers.logApiCall('POST', '/api/v1/auth/login');

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email-format',
          password: '',
        })
        .expect(400);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');

      TestHelpers.logTestEnd('User Login - Invalid Format');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      TestHelpers.logTestStart('Token Refresh - Success');

      const user = await TestHelpers.createTestUser({
        email: 'refresh@example.com',
      });

      // Get refresh token by logging in
      TestHelpers.logApiCall('POST', '/api/v1/auth/login');
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: user.password,
        });

      const { refreshToken } = loginResponse.body.data;

      TestHelpers.logApiCall('POST', '/api/v1/auth/refresh');

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.message).toBe('Token refreshed successfully');

      TestHelpers.logTestEnd('Token Refresh - Success');
    });

    it('should fail refresh with invalid token', async () => {
      TestHelpers.logTestStart('Token Refresh - Invalid Token');

      TestHelpers.logApiCall('POST', '/api/v1/auth/refresh');

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid refresh token');

      TestHelpers.logTestEnd('Token Refresh - Invalid Token');
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should get user profile successfully', async () => {
      TestHelpers.logTestStart('Get Profile - Success');

      const user = await TestHelpers.createTestUser({
        name: 'Profile Test User',
        email: 'profile@example.com',
      });

      TestHelpers.logApiCall('GET', '/api/v1/auth/profile');

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.name).toBe(user.name);
      expect(response.body.data.email).toBe(user.email);
      expect(response.body.data.password).toBeUndefined(); // Password should not be returned

      TestHelpers.logTestEnd('Get Profile - Success');
    });

    it('should fail to get profile without token', async () => {
      TestHelpers.logTestStart('Get Profile - No Token');

      TestHelpers.logApiCall('GET', '/api/v1/auth/profile');

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .expect(401);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No valid token provided');

      TestHelpers.logTestEnd('Get Profile - No Token');
    });

    it('should fail to get profile with invalid token', async () => {
      TestHelpers.logTestStart('Get Profile - Invalid Token');

      TestHelpers.logApiCall('GET', '/api/v1/auth/profile');

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token');

      TestHelpers.logTestEnd('Get Profile - Invalid Token');
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    it('should update profile successfully', async () => {
      TestHelpers.logTestStart('Update Profile - Success');

      const user = await TestHelpers.createTestUser({
        name: 'Update Test User',
        email: 'update@example.com',
      });

      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      TestHelpers.logApiCall('PUT', '/api/v1/auth/profile');

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${user.token}`)
        .send(updateData)
        .expect(200);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.email).toBe(updateData.email);
      expect(response.body.message).toBe('Profile updated successfully');

      TestHelpers.logTestEnd('Update Profile - Success');
    });

    it('should fail to update profile with invalid data', async () => {
      TestHelpers.logTestStart('Update Profile - Invalid Data');

      const user = await TestHelpers.createTestUser({
        email: 'updatefail@example.com',
      });

      TestHelpers.logApiCall('PUT', '/api/v1/auth/profile');

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${user.token}`)
        .send({
          name: 'A', // Too short
          email: 'invalid-email', // Invalid format
        })
        .expect(400);

      TestHelpers.logResponse(response.status, response.body.message);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');

      TestHelpers.logTestEnd('Update Profile - Invalid Data');
    });
  });
});