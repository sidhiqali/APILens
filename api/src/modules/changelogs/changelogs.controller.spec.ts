import { Test, TestingModule } from '@nestjs/testing';
import { ChangelogsController } from './changelogs.controller';
import { ChangelogsService } from './changelogs.service';

describe('ChangelogsController', () => {
  let controller: ChangelogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChangelogsController],
      providers: [ChangelogsService],
    }).compile();

    controller = module.get<ChangelogsController>(ChangelogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
