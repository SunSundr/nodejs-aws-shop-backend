import { RawAxiosResponseHeaders } from 'axios';

export enum ValidURLs {
  PRODUCTS = 'products',
  CART = 'cart',
  LOGIN = 'login',
  REGISTER = 'register',
}

export enum HttpMethods {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
}

export interface Query {
  [key: string]: string | string[] | undefined;
}

export interface AppRequest {
  path: string;
  method: HttpMethods;
  headers: Record<string, string>;
  query: Query;
  body: unknown;
}

export interface CacheObject {
  status: number;
  headers: RawAxiosResponseHeaders | Headers;
  body: any;
}
