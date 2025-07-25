import {
  IsString,
  IsOptional,
  IsArray,
  IsIn,
  IsBoolean,
} from 'class-validator';

export class UpdateApiDto {
  @IsOptional()
  @IsString()
  apiName?: string;

  @IsOptional()
  @IsString()
  @IsIn(['5m', '15m', '1h', '6h', '1d'])
  checkFrequency?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
