import { Injectable, HttpException, Inject } from '@nestjs/common';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { AppRequest, HttpMethods, ValidURLs } from './types';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AppService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  private getServiceURL(serviceName: string): string | undefined {
    const serviceUrls: { [key: string]: string } = {
      products: process.env.URL_PRODUCTS || '',
      cart: process.env.URL_CART || '',
    };

    return serviceUrls[serviceName];
  }

  private async proxyRequest(req: AppRequest): Promise<AxiosResponse['data']> {
    const { path, method, headers, query, body } = req;
    try {
      const newHeaders = { ...headers };
      delete newHeaders.host;
      delete newHeaders.connection;
      delete newHeaders['content-length'];

      const response = await axios({
        url: path,
        method,
        headers: newHeaders,
        params: query,
        data: method === HttpMethods.GET ? null : body,
        // validateStatus: null,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new HttpException(
          axiosError.response.data || 'Unknown data',
          axiosError.response.status || 502,
        );
      }
      throw new HttpException(
        `Error proxyRequest: ${error instanceof Error ? error.message : error}`,
        502,
      );
    }
  }

  async handleRequest(req: AppRequest): Promise<AxiosResponse['data']> {
    try {
      const pathSegments = req.path.split('/').filter((seg) => seg.length > 0);

      if (pathSegments.length === 0) {
        throw new HttpException('Bad request: unknown redirect path', 400);
      }

      const serviceName = pathSegments[0] as ValidURLs;
      const recipientUrl = this.getServiceURL(serviceName);

      if (!recipientUrl) throw new HttpException('Unknown service name', 502);

      const remainingPath = pathSegments.slice(1).join('/');
      const updRequest = {
        ...req,
        path: remainingPath ? `${recipientUrl}/${remainingPath}` : recipientUrl,
      };

      if (serviceName === ValidURLs.PRODUCTS && req.method === HttpMethods.GET) {
        const cachedData = await this.cacheManager.get(req.path);
        if (cachedData) {
          console.log('Cache Manager: use cache');
          return cachedData;
        }
        const response: unknown = await this.proxyRequest(updRequest);
        await this.cacheManager.set(req.path, response);
        return response;
      } else {
        return await this.proxyRequest(updRequest);
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Internal server error: ${error instanceof Error ? error.message : error}`,
        500,
      );
    }
  }
}
