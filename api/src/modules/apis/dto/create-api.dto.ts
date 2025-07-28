// api/src/modules/apis/dto/create-api.dto.ts
import { IsString, IsUrl, IsOptional, IsArray, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiDto {
  @ApiProperty({
    description: 'Name of the API to monitor',
    example: 'My REST API',
  })
  @IsString()
  apiName: string;

  @ApiProperty({
    description: 'URL to the OpenAPI specification (JSON or YAML)',
    example: 'https://api.example.com/openapi.json',
    format: 'url',
  })
  @IsUrl()
  openApiUrl: string;

  @ApiProperty({
    description: 'Type of API specification',
    example: 'openapi',
    default: 'openapi',
    required: false,
  })
  @IsOptional()
  @IsString()
  type: string = 'openapi';

  @ApiProperty({
    description: 'How frequently to check for changes',
    example: '1h',
    enum: ['5m', '15m', '1h', '6h', '1d'],
    default: '1h',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['5m', '15m', '1h', '6h', '1d'])
  checkFrequency: string = '1h';

  @ApiProperty({
    description: 'Tags to categorize the API',
    example: ['production', 'v1', 'public'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'Description of the API',
    example: 'Main production API for user management',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
