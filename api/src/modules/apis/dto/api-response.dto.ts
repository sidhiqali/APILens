import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the API',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the API',
    example: 'My REST API',
  })
  apiName: string;

  @ApiProperty({
    description: 'URL to the OpenAPI specification',
    example: 'https://api.example.com/openapi.json',
  })
  openApiUrl: string;

  @ApiProperty({
    description: 'Type of API specification',
    example: 'openapi',
  })
  type: string;

  @ApiProperty({
    description: 'Current version of the API',
    example: '1.2.0',
  })
  version: string;

  @ApiProperty({
    description: 'How frequently to check for changes',
    example: '1h',
    enum: ['5m', '15m', '1h', '6h', '1d'],
  })
  checkFrequency: string;

  @ApiProperty({
    description: 'Whether monitoring is active for this API',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Tags associated with the API',
    example: ['production', 'v1', 'public'],
    type: [String],
  })
  tags: string[];

  @ApiProperty({
    description: 'Current health status of the API',
    example: 'healthy',
    enum: ['healthy', 'unhealthy', 'checking', 'error', 'unknown'],
  })
  healthStatus: string;

  @ApiProperty({
    description: 'Last time the API was checked for changes',
    example: '2023-12-01T10:30:00.000Z',
  })
  lastChecked: Date;

  @ApiProperty({
    description: 'Last time the API health was checked',
    example: '2023-12-01T10:30:00.000Z',
  })
  lastHealthCheck: Date;

  @ApiProperty({
    description: 'Total number of changes detected',
    example: 5,
  })
  changeCount: number;

  @ApiProperty({
    description: 'Description of the API',
    example: 'Main production API for user management',
  })
  description: string;

  @ApiProperty({
    description: 'Date when the API was registered',
    example: '2023-11-01T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the API was last updated',
    example: '2023-12-01T10:30:00.000Z',
  })
  updatedAt: Date;
}
