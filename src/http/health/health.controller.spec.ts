import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { XyizleService } from 'xyizle';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: XyizleService,
          useValue: { ping: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('returns ok when Xyizle can ping TableSpoonDB', async () => {
    await expect(controller.getHealth()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });
});
