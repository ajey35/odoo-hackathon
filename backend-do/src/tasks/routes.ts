import { Router } from 'express';
import { TaskController } from './controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createTaskSchema,
  updateTaskSchema,
  taskParamsSchema,
  taskStatusSchema,
} from './schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', validate(createTaskSchema), TaskController.createTask);
router.get('/', TaskController.getTasks);
router.get('/:id', validate(taskParamsSchema), TaskController.getTask);
router.put('/:id', validate(updateTaskSchema), TaskController.updateTask);
router.delete('/:id', validate(taskParamsSchema), TaskController.deleteTask);
router.patch('/:id/status', validate(taskStatusSchema), TaskController.updateTaskStatus);

export default router;