export class ApiResponseDto {
  id: string;
  apiName: string;
  openApiUrl: string;
  type: string;
  version: string;
  checkFrequency: string;
  isActive: boolean;
  tags: string[];
  healthStatus: string;
  lastChecked: Date;
  lastHealthCheck: Date;
  changeCount: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
