import { Controller, Post, Get, Delete, Param, Body } from '@nestjs/common';
import { ApisService } from './apis.service';
import { CreateApiDto } from './dto/create-api.dto';
import { Api } from 'src/Schemas/api.schema';
import { ApiResponseDto } from './dto/api-response.dto';

@Controller('apis')
export class ApisController {
  constructor(private readonly apisService: ApisService) {}

  @Post('register')
  async register(@Body() dto: CreateApiDto): Promise<ApiResponseDto> {
    return this.apisService.registerApi(dto);
  }

  @Get()
  async getAll(): Promise<Api[]> {
    return this.apisService.getAllApis();
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.apisService.deleteApi(id);
    return { message: 'API deleted successfully' };
  }
}
