# Import Service

This part of the project defines a REST service developed using AWS CDK with TypeScript.

## Overview

The import service consists of the following Lambda functions:

- **`importProductsFile` Lambda Function:**

  - Handles CSV file uploads to the server by generating pre-signed URLs with limited-time access. Files are uploaded to the `uploaded` folder in S3.

- **`importFileParser` Lambda Function:**
  - Parses CSV files and moves them to the `parsed` folder in S3. This function is triggered by an S3 event (`s3:ObjectCreated:*`).
  - The function uses a readable stream to retrieve the object from S3 and parses it using the `csv-parser` package.
  - If parsing errors occur, the file is moved to the `failed` folder.
  - Each uploaded and moved file has a unique name consisting of: `${timestamp}\_${hash (md5)}\_${original truncatedName}` to prevent collisions during simultaneous uploads and when uploading files with the same names.

All function actions are logged to CloudWatch.

## API Endpoints

| Method    | Endpoint | Description                                          | Response Structure | Status Codes |
| --------- | -------- | ---------------------------------------------------- | ------------------ | ------------ |
| **`GET`** | `/`      | Generates a pre-signed URL for uploading a CSV file. | `{ url: string }`  | `200 OK`     |

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
