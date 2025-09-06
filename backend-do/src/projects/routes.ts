import { Router } from 'express';
import { ProjectController } from './controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  removeMemberSchema,
  projectParamsSchema,
} from './schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', validate(createProjectSchema), ProjectController.createProject);
router.get('/', ProjectController.getProjects);
router.get('/:id', validate(projectParamsSchema), ProjectController.getProject);
router.put('/:id', validate(updateProjectSchema), ProjectController.updateProject);
router.delete('/:id', validate(projectParamsSchema), ProjectController.deleteProject);

// Member management
router.post('/:id/members', validate(addMemberSchema), ProjectController.addMember);
router.delete('/:id/members/:userId', validate(removeMemberSchema), ProjectController.removeMember);

export default router;