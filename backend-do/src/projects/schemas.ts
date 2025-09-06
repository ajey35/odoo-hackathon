import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters'),
    description: z.string().optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters').optional(),
    description: z.string().optional(),
  }),
  params: z.object({
    id: z.string().cuid('Invalid project ID'),
  }),
});

export const addMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    role: z.enum(['MEMBER', 'ADMIN']).default('MEMBER'),
  }),
  params: z.object({
    id: z.string().cuid('Invalid project ID'),
  }),
});

export const removeMemberSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid project ID'),
    userId: z.string().cuid('Invalid user ID'),
  }),
});

export const projectParamsSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid project ID'),
  }),
});