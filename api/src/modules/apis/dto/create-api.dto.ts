import { IsString, IsUrl, IsOptional } from 'class-validator';

export class CreateApiDto {
  @IsString()
  apiName: string;

  @IsUrl()
  openApiUrl: string;

  @IsOptional()
  @IsString()
  type: string = 'openapi';
}
