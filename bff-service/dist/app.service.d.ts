import { AxiosResponse } from 'axios';
import { AppRequest } from './types';
import { Cache } from 'cache-manager';
export declare class AppService {
    private cacheManager;
    constructor(cacheManager: Cache);
    private getServiceURL;
    private proxyRequest;
    handleRequest(req: AppRequest): Promise<AxiosResponse['data']>;
}
