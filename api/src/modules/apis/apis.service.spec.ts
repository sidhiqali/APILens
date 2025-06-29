import { Test, TestingModule } from '@nestjs/testing';
import { ApisService } from './apis.service';

describe('ApisService', () => {
  let service: ApisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApisService],
    }).compile();

    service = module.get<ApisService>(ApisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
