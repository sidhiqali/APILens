// api/src/modules/apis/apis.controller.ts
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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
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

@ApiTags('apis')
@Controller('apis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ApisController {
  constructor(
    private readonly apisService: ApisService,
    private readonly changeDetectorService: ChangeDetectorService,
    private readonly smartSchedulerService: SmartSchedulerService,
    @InjectModel(Changelog.name) private changelogModel: Model<Changelog>,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Register a new API for monitoring',
    description:
      'Register a new API by providing its OpenAPI specification URL. The system will fetch the spec, validate it, and start monitoring for changes.',
  })
  @ApiBody({ type: CreateApiDto })
  @ApiResponse({
    status: 201,
    description: 'API registered successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid API specification or URL' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async register(
    @Body() dto: CreateApiDto,
    @Request() req,
  ): Promise<ApiResponseDto> {
    return this.apisService.registerApi(dto, req.user.userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all registered APIs',
    description:
      'Retrieve all APIs registered by the current user. Optionally filter by tag.',
  })
  @ApiQuery({
    name: 'tag',
    required: false,
    description: 'Filter APIs by tag',
  })
  @ApiResponse({
    status: 200,
    description: 'APIs retrieved successfully',
    type: [ApiResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAll(
    @Request() req,
    @Query('tag') tag?: string,
  ): Promise<ApiResponseDto[]> {
    if (tag) {
      return this.apisService.getApisByTag(tag, req.user.userId);
    }
    return this.apisService.getAllApis(req.user.userId);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get API statistics',
    description:
      'Get comprehensive statistics about user APIs including counts, health status, and recent activity.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: ApiStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(@Request() req): Promise<ApiStatsDto> {
    return this.apisService.getApiStats(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get API by ID',
    description: 'Retrieve detailed information about a specific API.',
  })
  @ApiParam({ name: 'id', description: 'API ID' })
  @ApiResponse({
    status: 200,
    description: 'API retrieved successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'API not found' })
  async getById(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ApiResponseDto> {
    return this.apisService.getApiById(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update API configuration',
    description:
      'Update API settings such as name, check frequency, tags, and description.',
  })
  @ApiParam({ name: 'id', description: 'API ID' })
  @ApiBody({ type: UpdateApiDto })
  @ApiResponse({
    status: 200,
    description: 'API updated successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'API not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateApiDto,
    @Request() req,
  ): Promise<ApiResponseDto> {
    return this.apisService.updateApi(id, dto, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete API',
    description:
      'Remove an API from monitoring. This will also delete all associated snapshots and change history.',
  })
  @ApiParam({ name: 'id', description: 'API ID' })
  @ApiResponse({ status: 204, description: 'API deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'API not found' })
  async delete(@Param('id') id: string, @Request() req): Promise<void> {
    await this.apisService.deleteApi(id, req.user.userId);
  }

  @Put(':id/toggle')
  @ApiOperation({
    summary: 'Toggle API monitoring status',
    description: 'Enable or disable monitoring for a specific API.',
  })
  @ApiParam({ name: 'id', description: 'API ID' })
  @ApiResponse({
    status: 200,
    description: 'API status toggled successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'API not found' })
  async toggleStatus(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ApiResponseDto> {
    return this.apisService.toggleApiStatus(id, req.user.userId);
  }

  @Post(':id/test')
  @ApiOperation({
    summary: 'Test API connection',
    description:
      'Test the connection to an API and check if the OpenAPI specification is accessible.',
  })
  @ApiParam({ name: 'id', description: 'API ID' })
  @ApiResponse({
    status: 200,
    description: 'Connection test completed',
    type: ApiHealthDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'API not found' })
  async testConnection(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ApiHealthDto> {
    return this.apisService.testApiConnection(id, req.user.userId);
  }

  @Get(':id/changelog')
  @ApiOperation({
    summary: 'Get API changelog',
    description: 'Retrieve the changelog history for a specific API.',
  })
  @ApiParam({ name: 'id', description: 'API ID' })
  @ApiResponse({
    status: 200,
    description: 'Changelog retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          apiId: { type: 'string' },
          previousVersion: { type: 'string' },
          newVersion: { type: 'string' },
          diffSummary: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'API not found' })
  async changelog(@Param('id') id: string) {
    return this.changelogModel.find({ apiId: id }).sort({ timestamp: -1 });
  }

  @Get(':id/changes')
  @ApiOperation({
    summary: 'Get API change history',
    description:
      'Retrieve detailed change history for a specific API with severity and impact information.',
  })
  @ApiParam({ name: 'id', description: 'API ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of changes to return (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Change history retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          apiId: { type: 'string' },
          fromVersion: { type: 'string' },
          toVersion: { type: 'string' },
          changeType: {
            type: 'string',
            enum: ['breaking', 'non-breaking', 'deprecation', 'addition'],
          },
          severity: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
          },
          changes: { type: 'array' },
          detectedAt: { type: 'string', format: 'date-time' },
          summary: { type: 'string' },
          impactScore: { type: 'number' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'API not found' })
  async getApiChanges(
    @Param('id') id: string,
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    const changes = await this.changeDetectorService.getApiChangeHistory(
      id,
      req.user.userId,
      limit ? parseInt(limit, 10) : 20,
    );
    return changes;
  }

  @Get(':id/snapshots')
  @ApiOperation({
    summary: 'Get API snapshots',
    description: 'Retrieve historical snapshots of the API specification.',
  })
  @ApiParam({ name: 'id', description: 'API ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of snapshots to return (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Snapshots retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          apiId: { type: 'string' },
          version: { type: 'string' },
          detectedAt: { type: 'string', format: 'date-time' },
          metadata: {
            type: 'object',
            properties: {
              endpointCount: { type: 'number' },
              schemaCount: { type: 'number' },
              specSize: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'API not found' })
  async getApiSnapshots(
    @Param('id') id: string,
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    const snapshots = await this.apisService.getApiSnapshots(
      id,
      req.user.userId,
      limit ? parseInt(limit, 10) : 10,
    );
    return snapshots;
  }

  @Post(':id/check-now')
  @ApiOperation({
    summary: 'Trigger immediate API check',
    description:
      'Manually trigger an immediate check for changes in the API specification.',
  })
  @ApiParam({ name: 'id', description: 'API ID' })
  @ApiResponse({
    status: 200,
    description: 'API check completed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        hasChanges: { type: 'boolean' },
        changes: { type: 'array' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'API not found' })
  async checkNow(@Param('id') id: string, @Request() req) {
    const result = await this.apisService.checkApiForChanges(id);
    return {
      message: 'API check completed',
      hasChanges: result.hasChanges,
      changes: result.changes,
    };
  }

  @Post('check-all')
  @ApiOperation({
    summary: 'Trigger check for all APIs',
    description: 'Manually trigger an immediate check for all registered APIs.',
  })
  @ApiResponse({
    status: 200,
    description: 'All APIs check completed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        checked: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkAllApis(@Request() req) {
    const result = await this.smartSchedulerService.triggerImmediateCheck();
    return result;
  }

  @Post('bulk/toggle-status')
  @ApiOperation({
    summary: 'Bulk toggle API status',
    description: 'Toggle active/inactive status for multiple APIs',
  })
  @ApiResponse({
    status: 200,
    description: 'APIs status toggled successfully',
  })
  async bulkToggleStatus(@Body() body: { ids: string[] }, @Request() req) {
    return this.apisService.bulkToggleStatus(body.ids, req.user.userId);
  }

  @Delete('bulk')
  @ApiOperation({
    summary: 'Bulk delete APIs',
    description: 'Delete multiple APIs at once',
  })
  @ApiResponse({
    status: 200,
    description: 'APIs deleted successfully',
  })
  async bulkDelete(@Body() body: { ids: string[] }, @Request() req) {
    return this.apisService.bulkDelete(body.ids, req.user.userId);
  }

  @Get(':id/documentation')
  @ApiOperation({
    summary: 'Get API documentation',
    description: 'Retrieve OpenAPI documentation for a specific API',
  })
  @ApiResponse({
    status: 200,
    description: 'API documentation retrieved successfully',
  })
  async getApiDocumentation(@Param('id') id: string, @Request() req) {
    return this.apisService.getApiDocumentation(id, req.user.userId);
  }

  @Post('validate-url')
  @ApiOperation({
    summary: 'Validate API URL',
    description:
      'Validate if an API URL is accessible and returns a valid response.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
      },
      required: ['url'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'URL validation completed',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        accessible: { type: 'boolean' },
        responseTime: { type: 'number' },
        error: { type: 'string' },
      },
    },
  })
  validateApiUrl(@Body() body: { url: string }) {
    return this.apisService.validateApiUrl(body.url);
  }
}
