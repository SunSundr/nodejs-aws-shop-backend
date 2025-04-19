"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const types_1 = require("./types");
const cache_manager_1 = require("@nestjs/cache-manager");
let AppService = class AppService {
    cacheManager;
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
    }
    getServiceURL(serviceName) {
        const serviceUrls = {
            products: process.env.URL_PRODUCTS || '',
            cart: process.env.URL_CART || '',
        };
        return serviceUrls[serviceName];
    }
    async proxyRequest(req) {
        const { path, method, headers, query, body } = req;
        try {
            const newHeaders = { ...headers };
            delete newHeaders.host;
            delete newHeaders.connection;
            delete newHeaders['content-length'];
            const response = await (0, axios_1.default)({
                url: path,
                method,
                headers: newHeaders,
                params: query,
                data: method === types_1.HttpMethods.GET ? null : body,
            });
            return response.data;
        }
        catch (error) {
            const axiosError = error;
            if (axiosError.response) {
                throw new common_1.HttpException(axiosError.response.data || 'Unknown data', axiosError.response.status || 502);
            }
            throw new common_1.HttpException(`Error proxyRequest: ${error instanceof Error ? error.message : error}`, 502);
        }
    }
    async handleRequest(req) {
        try {
            const pathSegments = req.path.split('/').filter((seg) => seg.length > 0);
            if (pathSegments.length === 0) {
                throw new common_1.HttpException('Bad request: unknown redirect path', 400);
            }
            const serviceName = pathSegments[0];
            const recipientUrl = this.getServiceURL(serviceName);
            if (!recipientUrl)
                throw new common_1.HttpException('Unknown service name', 502);
            const remainingPath = pathSegments.slice(1).join('/');
            const updRequest = {
                ...req,
                path: remainingPath ? `${recipientUrl}/${remainingPath}` : recipientUrl,
            };
            if (serviceName === types_1.ValidURLs.PRODUCTS && req.method === types_1.HttpMethods.GET) {
                const cachedData = await this.cacheManager.get(req.path);
                if (cachedData) {
                    console.log('Cache Manager: use cache');
                    return cachedData;
                }
                const response = await this.proxyRequest(updRequest);
                await this.cacheManager.set(req.path, response);
                return response;
            }
            else {
                return await this.proxyRequest(updRequest);
            }
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.HttpException(`Internal server error: ${error instanceof Error ? error.message : error}`, 500);
        }
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object])
], AppService);
//# sourceMappingURL=app.service.js.map