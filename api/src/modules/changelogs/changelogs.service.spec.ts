import { Test, TestingModule } from '@nestjs/testing';
import { ChangelogsService } from './changelogs.service';

describe('ChangelogsService', () => {
  let service: ChangelogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChangelogsService],
    }).compile();

    service = module.get<ChangelogsService>(ChangelogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
