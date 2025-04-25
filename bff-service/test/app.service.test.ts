/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AppService } from '../src/app.service';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { HttpException } from '@nestjs/common';
import { AppRequest, HttpMethods } from '../src/types';
import { Response } from 'express';

let cacheManager: jest.Mocked<Cache>;

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const serviceUrls: { [key: string]: string } = {
  products: 'products',
  cart: 'cart',
};

jest.mock('../src/utils/serviceUrls.ts', () => ({
  getServiceURL: jest.fn().mockImplementation((url: string) => serviceUrls[url]),
}));

describe('AppService', () => {
  let service: AppService;
  let mockRes: Response;

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    } as unknown as jest.Mocked<Cache>;

    mockRes = {
      header: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  describe('handleRequest', () => {
    it('should proxy GET request to /products and cache response', async () => {
      const fullHeaders = { 'content-type': 'application/json', host: 'localhost' };
      const { host, ...headers } = fullHeaders;
      const mockReq: AppRequest = {
        path: '/products/1',
        method: HttpMethods.GET,
        headers: fullHeaders,
        query: {},
        body: null,
      };

      const mockAxiosResponse: AxiosResponse = {
        data: { id: 1, name: 'Test Product' },
        status: 200,
        statusText: 'OK',
        headers,
        config: {} as any,
      };

      mockedAxios.request.mockResolvedValue(mockAxiosResponse);
      cacheManager.get.mockResolvedValue(null);

      const result = await service.handleRequest(mockReq, mockRes);

      expect(mockedAxios.request).toHaveBeenCalledWith({
        url: expect.stringContaining(mockReq.path.substring(1)),
        method: HttpMethods.GET,
        headers: expect.objectContaining(headers),
        params: mockReq.query,
        data: mockReq.body,
      });

      expect(cacheManager.set).toHaveBeenCalledWith('/products/1', {
        status: mockAxiosResponse.status,
        headers: mockAxiosResponse.headers,
        body: mockAxiosResponse.data,
      });

      expect(mockRes.status).toHaveBeenCalledWith(mockAxiosResponse.status);
      expect(mockRes.header).toHaveBeenCalledWith(mockAxiosResponse.headers);
      expect(result).toEqual(mockAxiosResponse.data);
    });

    it('should proxy GET request to /cart', async () => {
      const mockReq: AppRequest = {
        path: '/cart',
        method: HttpMethods.GET,
        headers: { Authorization: 'Basic AUTH' },
        query: {},
        body: null,
      };

      const mockAxiosResponse: AxiosResponse = {
        data: [{ cartId: '1', count: 1, product: { id: '1' } }],
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config: {} as any,
      };

      mockedAxios.request.mockResolvedValue(mockAxiosResponse);
      const result = await service.handleRequest(mockReq, mockRes);

      expect(mockedAxios.request).toHaveBeenCalledWith({
        url: expect.stringContaining(mockReq.path.substring(1)),
        method: HttpMethods.GET,
        headers: expect.objectContaining(mockReq.headers),
        params: mockReq.query,
        data: mockReq.body,
      });

      expect(cacheManager.set).not.toHaveBeenCalled();

      expect(mockRes.status).toHaveBeenCalledWith(mockAxiosResponse.status);
      expect(mockRes.header).toHaveBeenCalledWith(mockAxiosResponse.headers);
      expect(result).toEqual(mockAxiosResponse.data);
    });

    it('should return cached data for GET /products', async () => {
      const mockReq = { path: '/products/1', method: HttpMethods.GET } as AppRequest;
      const cachedData = { status: 200, headers: {}, body: { id: 1 } };
      cacheManager.get.mockResolvedValue(cachedData);
      const result = await service.handleRequest(mockReq, mockRes);
      expect(result).toEqual(cachedData.body);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.header).toHaveBeenCalledWith({});
    });

    it('should clear cache on DELETE /products', async () => {
      const mockReq = { path: '/products/1', method: HttpMethods.DELETE } as AppRequest;
      mockedAxios.request.mockResolvedValue({ status: 204 });
      await service.handleRequest(mockReq, mockRes);
      expect(cacheManager.clear).toHaveBeenCalled();
    });

    it('should no clear cache on POST /products', async () => {
      const mockReq = {
        path: '/products',
        method: HttpMethods.POST,
        body: { id: '1' },
      } as AppRequest;
      mockedAxios.request.mockResolvedValue({ status: 201 });
      await service.handleRequest(mockReq, mockRes);
      expect(cacheManager.clear).not.toHaveBeenCalled();
    });

    it('should throw 502 if service URL is invalid', async () => {
      const mockReq = { path: '/invalid/1', method: HttpMethods.GET } as AppRequest;
      await expect(service.handleRequest(mockReq, mockRes)).rejects.toThrow(
        new HttpException('Cannot process request', 502),
      );
    });

    it('should throw 400 if service URL is empty', async () => {
      const mockReq = { path: '', method: HttpMethods.GET } as AppRequest;
      await expect(service.handleRequest(mockReq, mockRes)).rejects.toThrow(
        new HttpException('Bad request', 400),
      );
    });

    it('should handle server errors (1)', async () => {
      const mockReq = { path: '/products', method: HttpMethods.GET } as AppRequest;
      const mockError = new Error('Network error');
      const consoleErrorSpy = jest.spyOn(globalThis.console, 'error').mockImplementation(() => {});

      mockedAxios.request.mockRejectedValue(mockError);

      await expect(service.handleRequest(mockReq, mockRes)).rejects.toThrow(
        new HttpException('Internal server error: Network error', 500),
      );
      consoleErrorSpy.mockRestore();
    });

    it('should handle server errors (2)', async () => {
      const mockReq = { path: '/products', method: HttpMethods.GET } as AppRequest;
      const mockError = Object.create(null);
      const consoleErrorSpy = jest.spyOn(globalThis.console, 'error').mockImplementation(() => {});

      mockedAxios.request.mockRejectedValue(mockError);

      await expect(service.handleRequest(mockReq, mockRes)).rejects.toThrow(
        new HttpException('Internal server error: Unknown error', 500),
      );
      consoleErrorSpy.mockRestore();
    });

    it('should handle axios errors (1)', async () => {
      const mockReq = { path: '/products', method: HttpMethods.GET } as AppRequest;
      const mockError = new AxiosError('Network error');
      mockError.response = {
        data: { status: 400, message: 'Bad Request' },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
      };
      mockedAxios.request.mockRejectedValue(mockError);

      await expect(service.handleRequest(mockReq, mockRes)).rejects.toThrow(
        new HttpException('Bad Request', 400),
      );
    });

    it('should handle axios errors (2)', async () => {
      const mockReq = { path: '/products', method: HttpMethods.GET } as AppRequest;
      const mockError = new AxiosError('Network error');
      mockError.response = {} as AxiosResponse;
      mockedAxios.request.mockRejectedValue(mockError);

      await expect(service.handleRequest(mockReq, mockRes)).rejects.toThrow(
        new HttpException('Unknown data', 502),
      );
    });
  });
});
