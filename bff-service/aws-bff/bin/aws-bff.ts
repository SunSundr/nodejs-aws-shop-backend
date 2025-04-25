#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsBffStack } from '../lib/aws-bff-stack';

const app = new cdk.App();
new AwsBffStack(app, 'AwsBffStack', {});