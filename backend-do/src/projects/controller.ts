import { Request, Response, NextFunction } from 'express';
import { ProjectService } from './service';
import { ApiResponseUtil } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export class ProjectController {
  static async createProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description } = req.body;
      const project = await ProjectService.createProject(name, description, req.user!.id);
      ApiResponseUtil.success(res, project, 'Project created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getProjects(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await ProjectService.getProjects(req.user!.id, page, limit);
      ApiResponseUtil.paginated(res, result.projects, result.meta, 'Projects retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const project = await ProjectService.getProject(id, req.user!.id);
      
      if (!project) {
        ApiResponseUtil.error(res, 'Project not found', 404);
        return;
      }

      ApiResponseUtil.success(res, project, 'Project retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const project = await ProjectService.updateProject(id, req.body, req.user!.id);
      ApiResponseUtil.success(res, project, 'Project updated successfully');
    } catch (error: any) {
      if (error.message === 'Insufficient permissions') {
        ApiResponseUtil.error(res, error.message, 403);
      } else {
        next(error);
      }
    }
  }

  static async deleteProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await ProjectService.deleteProject(id, req.user!.id);
      ApiResponseUtil.success(res, null, 'Project deleted successfully');
    } catch (error: any) {
      if (error.message === 'Only project owner can delete the project') {
        ApiResponseUtil.error(res, error.message, 403);
      } else {
        next(error);
      }
    }
  }

  static async addMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { email, role } = req.body;
      const membership = await ProjectService.addMember(id, email, role, req.user!.id);
      ApiResponseUtil.success(res, membership, 'Member added successfully');
    } catch (error: any) {
      if (error.message === 'Insufficient permissions') {
        ApiResponseUtil.error(res, error.message, 403);
      } else if (error.message === 'User not found') {
        ApiResponseUtil.error(res, error.message, 404);
      } else if (error.message === 'User is already a member of this project') {
        ApiResponseUtil.error(res, error.message, 409);
      } else {
        next(error);
      }
    }
  }

  static async removeMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, userId } = req.params;
      await ProjectService.removeMember(id, userId, req.user!.id);
      ApiResponseUtil.success(res, null, 'Member removed successfully');
    } catch (error: any) {
      if (error.message === 'Insufficient permissions') {
        ApiResponseUtil.error(res, error.message, 403);
      } else if (error.message === 'Cannot remove project owner') {
        ApiResponseUtil.error(res, error.message, 400);
      } else {
        next(error);
      }
    }
  }
}