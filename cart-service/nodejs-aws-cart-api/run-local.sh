#!/bin/bash

export $(grep -v '^#' .env | xargs)

docker run -it --rm \
  --env-file .env \
  -p 4000:4000 \
  sunsundr-nodejs-aws-cart-api
