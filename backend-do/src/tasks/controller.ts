import { Request, Response, NextFunction } from 'express';
import { TaskService } from './service';
import { ApiResponseUtil } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export class TaskController {
  static async createTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await TaskService.createTask(req.body, req.user!.id);
      ApiResponseUtil.success(res, task, 'Task created successfully', 201);
    } catch (error: any) {
      if (error.message === 'You are not a member of this project' || 
          error.message === 'Assigned user is not a member of this project') {
        ApiResponseUtil.error(res, error.message, 400);
      } else {
        next(error);
      }
    }
  }

  static async getTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        projectId: req.query.projectId as string,
        status: req.query.status as string,
        assignedTo: req.query.assignedTo as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      const result = await TaskService.getTasks(req.user!.id, filters);
      ApiResponseUtil.paginated(res, result.tasks, result.meta, 'Tasks retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const task = await TaskService.getTask(id, req.user!.id);
      
      if (!task) {
        ApiResponseUtil.error(res, 'Task not found', 404);
        return;
      }

      ApiResponseUtil.success(res, task, 'Task retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const task = await TaskService.updateTask(id, req.body, req.user!.id);
      ApiResponseUtil.success(res, task, 'Task updated successfully');
    } catch (error: any) {
      if (error.message === 'Task not found') {
        ApiResponseUtil.error(res, error.message, 404);
      } else if (error.message === 'Assigned user is not a member of this project') {
        ApiResponseUtil.error(res, error.message, 400);
      } else {
        next(error);
      }
    }
  }

  static async deleteTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await TaskService.deleteTask(id, req.user!.id);
      ApiResponseUtil.success(res, null, 'Task deleted successfully');
    } catch (error: any) {
      if (error.message === 'Task not found') {
        ApiResponseUtil.error(res, error.message, 404);
      } else if (error.message === 'Insufficient permissions to delete this task') {
        ApiResponseUtil.error(res, error.message, 403);
      } else {
        next(error);
      }
    }
  }

  static async updateTaskStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const task = await TaskService.updateTask(id, { status }, req.user!.id);
      ApiResponseUtil.success(res, task, 'Task status updated successfully');
    } catch (error: any) {
      if (error.message === 'Task not found') {
        ApiResponseUtil.error(res, error.message, 404);
      } else {
        next(error);
      }
    }
  }
}