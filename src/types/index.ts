export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { endpoints: number };
}

export type CreateProjectInput = Pick<Project, 'name' | 'description'>;

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
  statusCode: number;
  responseHeaders: string | null; // JSON object string
  errorStatusCode: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateEndpointInput = Omit<Endpoint, 'id' | 'createdAt' | 'updatedAt' | 'projectId'> & { projectId?: string };
export type UpdateEndpointInput = Partial<CreateEndpointInput>;
