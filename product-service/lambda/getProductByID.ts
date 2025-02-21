import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { products } from './@mockData';
import { getHeaders } from './@headers';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.id;
  const product = products.find((item) => item.id === id);

  if (!product) {
    return {
      statusCode: 404,
      headers: getHeaders([CorsHttpMethod.GET]),
      body: JSON.stringify({ message: 'Product not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: getHeaders([CorsHttpMethod.GET]),
    body: JSON.stringify(product),
  };
};
