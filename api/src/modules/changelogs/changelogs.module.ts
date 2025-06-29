import { Module } from '@nestjs/common';
import { ChangelogsService } from './changelogs.service';
import { ChangelogsController } from './changelogs.controller';

@Module({
  controllers: [ChangelogsController],
  providers: [ChangelogsService],
})
export class ChangelogsModule {}
