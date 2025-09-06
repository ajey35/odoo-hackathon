import { PrismaClient } from '@prisma/client';
import logger from '../src/utils/logger';

const prisma = new PrismaClient();

// Global test setup
beforeAll(async () => {
  logger.info('🚀 Setting up test environment...');
  
  // Connect to test database
  await prisma.$connect();
  logger.info('✅ Connected to test database');
});

// Clean up after each test
beforeEach(async () => {
  logger.info('🧹 Cleaning up database before test...');
  
  // Clean up in reverse order of dependencies
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.teamMembership.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  
  logger.info('✅ Database cleaned up');
});

// Global test teardown
afterAll(async () => {
  logger.info('🔚 Tearing down test environment...');
  await prisma.$disconnect();
  logger.info('✅ Disconnected from test database');
});

export { prisma };