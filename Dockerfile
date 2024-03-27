# FROM ubuntu:20.04

# ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update -y && apt-get install -y \
    software-properties-common \
    apt-transport-https \
    curl \
    # Only needed to build indy-sdk
    build-essential

# # yarn
# RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
#     echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

# # install depdencies
# RUN apt-get update -y && apt-get install -y --allow-unauthenticated \
#     nodejs

# # install depdencies
# RUN apt-get update -y && apt-get install -y --allow-unauthenticated \
#     nodejs

# install depdencies
RUN apt-get update -y && apt-get install -y --allow-unauthenticated \
    nodejs

# Install yarn seperately due to `no-install-recommends` to skip nodejs install
RUN apt-get install -y --no-install-recommends yarn

RUN yarn global add patch-package

# Build the application
RUN yarn build

# Stage 2: Production stage
FROM node:18.19.0-slim

WORKDIR /app

COPY build ./build
# COPY libindy_vdr.so /usr/lib/
# COPY libindy_vdr.so /usr/local/lib/

# Set entry point
ENTRYPOINT ["node", "./bin/afj-rest.js", "start"]
