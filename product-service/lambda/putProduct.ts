import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { proxyResult } from './@proxyResult';
import { products } from '../db/data';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return proxyResult(400, CorsHttpMethod.PUT, { message: 'Invalid request: body is required' });
  }

  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch {
    return proxyResult(400, CorsHttpMethod.PUT, { message: 'Invalid JSON format' });
  }

  const { id } = requestBody;
  if (!id) {
    return proxyResult(400, CorsHttpMethod.PUT, { message: 'Product ID is required' });
  }

  const product = products.find((item) => item.id === id);
  if (!product) {
    return proxyResult(404, CorsHttpMethod.PUT, { message: 'Product not found' });
  }

  return proxyResult(200, CorsHttpMethod.PUT, { message: 'Product updated successfully', product });
};
