import { Controller } from '@nestjs/common';
import { ChangelogsService } from './changelogs.service';

@Controller('changelogs')
export class ChangelogsController {
  constructor(private readonly changelogsService: ChangelogsService) {}
}
