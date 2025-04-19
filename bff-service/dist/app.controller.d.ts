import { AppService } from './app.service';
import { AppRequest } from './types';
import { AxiosResponse } from 'axios';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getStatus(): {
        status: string;
    };
    handleRequest(req: AppRequest): Promise<AxiosResponse['data']>;
}
