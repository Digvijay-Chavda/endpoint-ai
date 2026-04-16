export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

export interface Endpoint {
  id: string;
  projectId: string;
  path: string;
  method: HttpMethod;
  responseBody: string; // JSON string
  latencyMs: number;
  errorRate: number; // 0 to 1 (e.g., 0.1)
  active: boolean;
  requireAuth: boolean;
  customAuthHeader: string | null;
  enableCors: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateEndpointInput = Omit<Endpoint, 'id' | 'createdAt' | 'updatedAt' | 'projectId'> & { projectId?: string };
export type UpdateEndpointInput = Partial<CreateEndpointInput>;
