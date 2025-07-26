import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApisService } from './apis.service';
import { CreateApiDto } from './dto/create-api.dto';
import { UpdateApiDto } from './dto/update-api.dto';
import { ApiResponseDto } from './dto/api-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiHealthDto, ApiStatsDto } from './dto/api.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Changelog } from 'src/Schemas/changelog-schema';
import { Model } from 'mongoose';
import { ChangeDetectorService } from './change-detector.service';
import { SmartSchedulerService } from '../schedules/smart-scheduler.service';

@Controller('apis')
@UseGuards(JwtAuthGuard)
export class ApisController {
  constructor(
    private readonly apisService: ApisService,
    private readonly changeDetectorService: ChangeDetectorService,
    private readonly smartSchedulerService: SmartSchedulerService,
    @InjectModel(Changelog.name) private changelogModel: Model<Changelog>,
  ) {}

  @Post()
  async register(
    @Body() dto: CreateApiDto,
    @Request() req,
  ): Promise<ApiResponseDto> {
    return this.apisService.registerApi(dto, req.user.userId);
  }

  @Get()
  async getAll(
    @Request() req,
    @Query('tag') tag?: string,
  ): Promise<ApiResponseDto[]> {
    if (tag) {
      return this.apisService.getApisByTag(tag, req.user.userId);
    }
    return this.apisService.getAllApis(req.user.userId);
  }

  // total api stats
  @Get('stats')
  async getStats(@Request() req): Promise<ApiStatsDto> {
    return this.apisService.getApiStats(req.user.userId);
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ApiResponseDto> {
    return this.apisService.getApiById(id, req.user.userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateApiDto,
    @Request() req,
  ): Promise<ApiResponseDto> {
    return this.apisService.updateApi(id, dto, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Request() req): Promise<void> {
    await this.apisService.deleteApi(id, req.user.userId);
  }

  @Put(':id/toggle')
  async toggleStatus(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ApiResponseDto> {
    return this.apisService.toggleApiStatus(id, req.user.userId);
  }

  @Post(':id/test')
  async testConnection(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ApiHealthDto> {
    return this.apisService.testApiConnection(id, req.user.userId);
  }

  // @Patch(':id/refresh')
  // async refresh(@Param('id') id: string) {
  //   const result = await this.apisService.refreshApi(id);
  //   return { success: true, ...result };
  // }

  @Get(':id/changelog')
  async changelog(@Param('id') id: string) {
    return this.changelogModel.find({ apiId: id }).sort({ timestamp: -1 });
  }

  // @Post(':id/check-now')
  // checkNow(@Param('id') id: string, @Request() req): { message: string } {
  //   // TODO: Trigger immediate check via scheduler service
  //   return { message: 'Check triggered successfully' };
  // }

  @Get(':id/changes')
  async getApiChanges(
    @Param('id') id: string,
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    // Get change history for specific API
    const changes = await this.changeDetectorService.getApiChangeHistory(
      id,
      req.user.userId,
      limit ? parseInt(limit, 10) : 20,
    );
    return changes;
  }

  @Get(':id/snapshots')
  async getApiSnapshots(
    @Param('id') id: string,
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    // Get snapshots for specific API
    const snapshots = await this.apisService.getApiSnapshots(
      id,
      req.user.userId,
      limit ? parseInt(limit, 10) : 10,
    );
    return snapshots;
  }

  @Post(':id/check-now')
  async checkNow(@Param('id') id: string, @Request() req) {
    const result = await this.apisService.checkApiForChanges(id);
    return {
      message: 'API check completed',
      hasChanges: result.hasChanges,
      changes: result.changes,
    };
  }

  @Post('check-all')
  async checkAllApis(@Request() req) {
    const result = await this.smartSchedulerService.triggerImmediateCheck();
    return result;
  }
}
