import { Injectable, HttpException, Inject } from '@nestjs/common';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Response } from 'express';
import { getServiceURL } from './utils/serviceUrls';
import { AppRequest, CacheObject, HttpMethods, ValidURLs } from './types';

@Injectable()
export class AppService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  private sanitizeHeaders(headers: Record<string, string>) {
    const { host, connection, 'content-length': _, ...cleanedHeaders } = headers;
    return cleanedHeaders;
  }

  private isClearCache(serviceName: string, method: HttpMethods): boolean {
    return (
      serviceName === ValidURLs.PRODUCTS &&
      (method === HttpMethods.DELETE || method === HttpMethods.PUT)
    );
  }

  private handleError(error: unknown): never {
    if (error instanceof HttpException) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Proxy error:', message);
    throw new HttpException(`Internal server error: ${message}`, 500);
  }

  private async proxyRequest(
    req: AppRequest,
    res: Response,
    savePath?: string,
  ): Promise<AxiosResponse['data']> {
    const { path, method, headers, query, body } = req;
    try {
      const newHeaders = this.sanitizeHeaders(headers);
      const response = await axios.request({
        url: path,
        method,
        headers: newHeaders,
        params: query,
        data: method === HttpMethods.GET ? null : body,
      });
      if (savePath) {
        await this.cacheManager.set<CacheObject>(savePath, {
          status: response.status,
          headers: response.headers,
          body: response.data as unknown,
        });
      }
      res.header(response.headers);
      res.status(response.status);

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new HttpException(
          axiosError.response.data || 'Unknown data',
          axiosError.response.status || 502,
        );
      }
      this.handleError(error);
    }
  }

  async handleRequest(req: AppRequest, res: Response): Promise<AxiosResponse['data']> {
    try {
      const [serviceName, ...rest] = req.path.split('/').filter(Boolean);

      if (!serviceName) throw new HttpException('Bad request', 400);

      const recipientUrl = getServiceURL(serviceName as ValidURLs);

      if (!recipientUrl) throw new HttpException('Cannot process request', 502);

      const remainingPath = rest.join('/');
      const updRequest = {
        ...req,
        headers: { ...req.headers },
        path: remainingPath ? `${recipientUrl}/${remainingPath}` : recipientUrl,
      };

      if (serviceName === ValidURLs.PRODUCTS && req.method === HttpMethods.GET) {
        const cachedData = await this.cacheManager.get<CacheObject>(req.path);
        if (cachedData) {
          res.status(cachedData.status);
          res.header(cachedData.headers);
          return cachedData.body;
        }

        return await this.proxyRequest(updRequest, res, req.path);
      } else {
        if (this.isClearCache(serviceName, req.method)) await this.cacheManager.clear();

        return await this.proxyRequest(updRequest, res);
      }
    } catch (error) {
      this.handleError(error);
    }
  }
}
