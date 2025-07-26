import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SmartSchedulerService } from './smart-scheduler.service';

@Controller('schedules')
@UseGuards(JwtAuthGuard)
export class SchedulesController {
  constructor(private readonly smartSchedulerService: SmartSchedulerService) {}

  @Post('trigger-check')
  async triggerImmediateCheck() {
    return this.smartSchedulerService.triggerImmediateCheck();
  }
}
