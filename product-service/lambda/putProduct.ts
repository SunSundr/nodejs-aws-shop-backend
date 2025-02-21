import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { products } from './@mockData';
import { getHeaders } from './@headers';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: getHeaders([CorsHttpMethod.PUT]),
      body: JSON.stringify({ message: 'Invalid request: body is required' }),
    };
  }

  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: getHeaders([CorsHttpMethod.PUT]),
      body: JSON.stringify({ message: 'Invalid JSON format' }),
    };
  }

  const { id } = requestBody;
  if (!id) {
    return {
      statusCode: 400,
      headers: getHeaders([CorsHttpMethod.PUT]),
      body: JSON.stringify({ message: 'Product ID is required' }),
    };
  }

  const product = products.find((item) => item.id === id);
  if (!product) {
    return {
      statusCode: 404,
      headers: getHeaders([CorsHttpMethod.PUT]),
      body: JSON.stringify({ message: 'Product not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: getHeaders([CorsHttpMethod.PUT]),
    body: JSON.stringify({ message: 'Product updated successfully', product }),
  };
};
