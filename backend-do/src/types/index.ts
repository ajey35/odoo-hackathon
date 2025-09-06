import { User, Project, Task, Message, Notification } from '@prisma/client';

// Auth Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// Extended Types
export interface ProjectWithMembers extends Project {
  teamMemberships?: {
    user: User;
    role: string;
  }[];
  _count?: {
    tasks: number;
    teamMemberships: number;
  };
}

export interface TaskWithDetails extends Task {
  project: Pick<Project, 'id' | 'name'>;
  assignee?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface MessageWithAuthor extends Message {
  author: Pick<User, 'id' | 'name'>;
}