# Product Service

This part of the project defines a REST service developed using AWS CDK with TypeScript.

## API Endpoints

- ### Products _(/products route)_
  `Product`:
  ```typescript
  interface Product {
    id: string; // uuid v4
    title: string;
    description: string;
    price: number;
    imageURL?: string;
  }
  ```
  | Method       | Endpoint        | Description              | Response Structure            | Status Codes                                                   |
  | ------------ | --------------- | ------------------------ | ----------------------------- | -------------------------------------------------------------- |
  | **`GET`**    | `/products`     | Get all products         | `[{product}, {product}, ...]` | `200 OK`                                                       |
  | **`GET`**    | `/products/:id` | Get single product by id | `{product}`                   | `200 OK`, `404 Not Found`                                      |
  | **`PUT`**    | `/products/:id` | Update or add product    | `null` (No Content)           | `200 OK`, `400 Bad Request` (Invalid request), `404 Not Found` |
  | **`DELETE`** | `/products/:id` | Delete product           | `null` (No Content)           | `200 OK`, `403 Forbidden` (Missing ID), `404 Not Found`        |


## Useful commands

- `npm run build`: Compiles TypeScript code to JavaScript.
- `npm run watch`: Compiles TypeScript code in watch mode, automatically recompiling on changes.
- `npm run test`: Runs Jest tests.
- `npm run test:coverage`: Runs Jest tests and generates code coverage reports.
- `npm run cdk`: Executes CDK commands directly. Use `npm run cdk <command>`.
- `npm run cdk:bootstrap`: Bootstraps the AWS CDK environment.
- `npm run cdk:deploy`: Builds the project and deploys the CDK stack to AWS.
- `npm run cdk:destroy`: Destroys the CDK stack in AWS.
- `npm run cdk:diff`: Builds the project and shows the differences between the current CDK stack and the deployed stack.
- `npm run cdk:synth`: Builds the project and synthesizes the CloudFormation template for the CDK stack.
- `npm run lint`: Runs ESLint to lint and automatically fix code style issues.
- `npm run prettier`: Formats the code in the `lambda`, `lib`, and `test` directories using Prettier.