# BFF Service

## Description

The BFF (Backend for Frontend) service acts as a gateway for interacting with multiple backend services, such as the Cart Service and Product Service. It provides a unified API for the frontend, simplifying data aggregation and reducing the complexity of direct communication with individual backend systems. This service is implemented as a NestJS application. The application is built for deployment using esbuild, with build configurations defined in `build-optimized.cjs`.

## Features

-   **Unified API:** Provides a single entry point for frontend applications to access backend data.
-   **Proxying:** Proxies requests to the Cart and Product services.
-   **Caching:** Caches responses to improve performance and reduce latency.
-   **Built with NestJS:** Leverages the power and structure of the NestJS framework.
-   **Optimized Build:** Uses esbuild for fast and efficient builds, configured via `build-optimized.cjs`.

## Getting Started

### Prerequisites

Ensure you have the following installed:

-   [Node.js](https://nodejs.org/) (latest stable version recommended)
-   [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
-   [AWS CDK](https://aws.amazon.com/cdk/) installed globally
-   [EB CLI](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html) installed globally

### Installation

1.  Navigate to the BFF Service directory:

    ```sh
    cd bff-service
    ```

2.  Install dependencies:

    ```sh
    npm ci
    ```

### Environment Configuration

Create a `.env` file in the root of the `bff-service` directory with the following variables:

```env
PORT=3000
URL_CART=http://localhost:4000                         # Cart Service URL
URL_PRODUCTS=http://localhost:5000                     # Product Service URL
URL_LOGIN=http://localhost:4000/api/auth/login         # Cart Service URL (temporary login)
URL_REGISTER=http://localhost:4000/api/auth/register   # Cart Service URL (temporary register)
```

### Running the Application Locally

The following npm scripts are available for running the application:

-   `npm run build`: Builds the application using `build-optimized.cjs` and esbuild.
-   `npm run build:nest`: Builds the application using NestJS CLI.
-   `npm run start`: Starts the application from the compiled output.
-   `npm run start:nest`: Starts the application using NestJS CLI.
-   `npm run start:dev`: Starts the application in development mode with hot-reloading.
-   `npm run start:debug`: Starts the application in debug mode with hot-reloading.
-   `npm run start:prod`: Starts the application in production mode.

## Deployment

Deployment to AWS Elastic Beanstalk is facilitated by the `bff-service/run-deploy.sh` script. This script automates the process of initializing and creating an Elastic Beanstalk environment.

**Here's a breakdown of the script's functionality:**

1.  **Environment Variable Check:**  The script first checks if the `GITHUB_LOGIN` environment variable is set. This variable is assumed to be your GitHub username, used for naming the Elastic Beanstalk environment.

2.  **Environment Variable Aggregation:**  It then reads all environment variables from the `.env` file (excluding comments) and formats them into a comma-separated string for use with the Elastic Beanstalk `eb create` command.

3.  **Environment Name Prompt:**  The script prompts the user to enter an environment name (e.g., "develop", "test", or "prod"). The environment name must be at least four characters long.

4.  **Elastic Beanstalk Initialization:**  The script initializes the Elastic Beanstalk environment using `eb init`. This command sets up the necessary configuration files for Elastic Beanstalk. It also specifies the Node.js platform and the AWS region (eu-north-1).

5.  **Elastic Beanstalk Environment Creation:**  Finally, the script creates the Elastic Beanstalk environment using `eb create`. This command provisions the AWS resources required to run the application.  The command includes:

    -   A custom CNAME based on the `GITHUB_LOGIN` and the chosen environment name.
    -   The `--single` option, which creates a single-instance environment.
    -   The AWS region.
    -   The Node.js platform (Node.js 18 running on 64bit Amazon Linux 2023).
    -   The environment variables extracted from the `.env` file.
    -   Verbose output and logging to a file named `eb_create.log`.

**To deploy the application:**

1.  Ensure you have properly configured your `.env` file
2.  Make sure you have the `GITHUB_LOGIN` environment variable set.
3.  Run the `bff-service/run-deploy.sh` script.  You will be prompted to enter the environment name.

### AWS Configuration

The `bff-service/aws-bff` directory contains AWS CDK code for configuring additional AWS resources, such as a CloudFront distribution for the Elastic Beanstalk domain. This directory represents a separate AWS CDK project and requires its own dependencies to be installed.  Navigate to this directory (`cd bff-service/aws-bff`) and run `npm ci` or `npm install` to install the necessary packages before using the CDK commands.

The following npm scripts are available for managing the AWS CDK stack:

-   `npm run cdk:deploy`: Builds the application and deploys the CDK stack.
-   `npm run cdk:destroy`: Destroys the CDK stack.
-   `npm run cdk:diff`: Builds the application and shows the difference between the current CDK stack and the deployed stack.
-   `npm run cdk:synth`: Builds the application and synthesizes the CDK stack.

## API Documentation

### Available Endpoints

#### /products

All endpoints provided by the `product-service` are proxied through this endpoint.

#### /cart

All endpoints provided by the `cart-service` are proxied through this endpoint.