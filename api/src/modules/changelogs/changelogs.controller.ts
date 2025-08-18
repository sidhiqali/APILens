import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ChangelogsService } from './changelogs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('changelogs')
@UseGuards(JwtAuthGuard)
export class ChangelogsController {
  constructor(private readonly changelogsService: ChangelogsService) {}

  @Get()
  async getAllChanges(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('severity') severity?: string,
    @Query('type') type?: string,
    @Query('days') days?: string,
  ) {
    const params = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      severity,
      type,
      days: days ? parseInt(days, 10) : undefined,
    };

    return await this.changelogsService.getAllChanges(req.user.userId, params);
  }
}
