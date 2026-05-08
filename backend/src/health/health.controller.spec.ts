import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let queryMock: jest.Mock;

  beforeEach(async () => {
    queryMock = jest.fn().mockResolvedValue([{ ok: 1 }]);
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: getDataSourceToken(),
          useValue: { query: queryMock },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('GET health returns connected', async () => {
    await expect(controller.getHealth()).resolves.toEqual({
      status: 'ok',
      database: 'connected',
    });
    expect(queryMock).toHaveBeenCalled();
  });
});
