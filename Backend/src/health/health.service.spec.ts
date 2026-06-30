import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, beforeEach } from '@jest/globals';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('returns the service status', () => {
    expect(service.getStatus()).toBe('ok');
  });
});
