import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Task title is required'),
    description: z.string().optional(),
    projectId: z.string().cuid('Invalid project ID'),
    assignedTo: z.string().cuid('Invalid user ID').optional(),
    dueDate: z.string().datetime().optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Task title is required').optional(),
    description: z.string().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    assignedTo: z.string().cuid('Invalid user ID').optional(),
    dueDate: z.string().datetime().optional(),
  }),
  params: z.object({
    id: z.string().cuid('Invalid task ID'),
  }),
});

export const taskParamsSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid task ID'),
  }),
});

export const taskStatusSchema = z.object({
  body: z.object({
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  }),
  params: z.object({
    id: z.string().cuid('Invalid task ID'),
  }),
});