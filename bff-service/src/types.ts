export enum ValidURLs {
  PRODUCTS = 'products',
  CART = 'cart',
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

export interface Headers {
  [key: string]: string | string[] | undefined;
  host?: string;
  connection?: string;
  'content-length'?: string;
}

export interface Query {
  [key: string]: string | string[] | undefined;
}

export interface AppRequest {
  path: string;
  method: HttpMethods;
  headers: Headers;
  query: Query;
  body: unknown;
}
