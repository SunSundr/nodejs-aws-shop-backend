#!/bin/bash

if [ ! -f .env ]; then
  echo "Error: .env file not found!"
  exit 1
fi

GITHUB_LOGIN=$(echo "${GITHUB_USER:-$(git config user.name)}" | tr '[:upper:]' '[:lower:]')

if [ -z "$GITHUB_LOGIN" ]; then
  echo "Error: GitHub login not found!"
  exit 1
fi

ENV_VARS=$(grep -v '^#' .env | xargs | sed 's/ /,/g')

read -p "Enter environment name (develop/test/prod): " ENV_NAME

if [ ${#ENV_NAME} -lt 4 ]; then
  echo "Error: Environment name must be at least 4 characters!"
  exit 1
fi

eb init "${GITHUB_LOGIN}-bff-api" --platform "Node.js 18" --region eu-north-1 && \

eb create "${ENV_NAME}" \
  --cname "${GITHUB_LOGIN}-bff-api-${ENV_NAME}" \
  --single \
  --region eu-north-1 \
  --platform "Node.js 18 running on 64bit Amazon Linux 2023" \
  --envvars "$ENV_VARS" \
  --verbose \
  2>&1 | tee eb_create.log
