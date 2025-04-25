/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            handleRequest: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  describe('GET /status', () => {
    it('should return { status: "ok" }', () => {
      expect(appController.getStatus()).toEqual({ status: 'ok' });
    });
  });

  describe('ALL *', () => {
    it('should call AppService.handleRequest', async () => {
      const mockReq = { path: '/products/1', method: 'GET' } as any;
      const mockRes = { header: jest.fn(), status: jest.fn() } as any;
      const mockResult = { data: 'test' };

      jest.spyOn(appService, 'handleRequest').mockResolvedValue(mockResult);

      await expect(appController.handleRequest(mockReq, mockRes)).resolves.toBe(mockResult);
      expect(appService.handleRequest).toHaveBeenCalledWith(mockReq, mockRes);
    });
  });
});
