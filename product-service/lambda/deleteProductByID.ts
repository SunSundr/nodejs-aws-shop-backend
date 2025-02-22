import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { products } from './@mockData';
import { getHeaders } from './@headers';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const productId = event.pathParameters?.id;

  if (!productId) {
    return {
      statusCode: 403,
      headers: getHeaders([CorsHttpMethod.DELETE]),
      body: JSON.stringify({ message: 'ID must be provided' }),
    };
  }

  const product = products.find((item) => item.id === productId);

  if (!product) {
    return {
      statusCode: 404,
      headers: getHeaders([CorsHttpMethod.DELETE]),
      body: JSON.stringify({ message: 'Product not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: getHeaders([CorsHttpMethod.DELETE]),
    body: JSON.stringify(null),
  };
};
