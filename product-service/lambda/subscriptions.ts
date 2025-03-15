import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { SNSClient, SubscribeCommand } from '@aws-sdk/client-sns';
import { proxyResult } from './@proxyResult';
import { errorResult } from './@errorResult';
import { formatLog } from './@formatLogs';
import { HttpMethod } from './@types';

const snsClient = new SNSClient();

type FilterPolicy = {
  [key: string]: Array<string | unknown>;
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(formatLog(event.httpMethod, event.path, event));
  const CREATE_PRODUCT_TOPIC_ARN = process.env.CREATE_PRODUCT_TOPIC_ARN;
  if (!CREATE_PRODUCT_TOPIC_ARN) {
    throw new Error('CREATE_PRODUCT_TOPIC_ARN environment variable is not set');
  }
  if (!event.body) {
    return proxyResult(400, HttpMethod.POST, { message: 'Invalid request: body is required' });
  }

  const { email, filterType, minPrice, maxPrice, keywords } = JSON.parse(event.body);

  try {
    const filterPolicy: FilterPolicy = {};
    if (filterType === 'price') {
      filterPolicy.price = [{ numeric: ['>=', Number(minPrice), '<=', Number(maxPrice)] }];
    } else if (filterType === 'keywords') {
      filterPolicy.keywords = keywords.split(',').map((kw: string) => kw.trim());
    }

    const snsParams = {
      Protocol: 'email',
      TopicArn: CREATE_PRODUCT_TOPIC_ARN,
      Endpoint: email,
      ...(Object.keys(filterPolicy).length > 0 && {
        Attributes: { FilterPolicy: JSON.stringify(filterPolicy) },
      }),
    };

    const subscribeCommand = new SubscribeCommand(snsParams);
    await snsClient.send(subscribeCommand);

    return proxyResult(200, HttpMethod.POST, {
      message: 'Subscription request sent! Please check your email to confirm.',
    });
  } catch (error) {
    console.error('Error subscribing email:', error);
    return errorResult(error, HttpMethod.POST);
  }
};
