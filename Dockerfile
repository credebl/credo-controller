FROM ubuntu:20.04

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update -y && apt-get install -y \
    software-properties-common \
    apt-transport-https \
    curl \
    # Only needed to build indy-sdk
    build-essential 

# libindy
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys CE7709D068DB5E88
RUN add-apt-repository "deb https://repo.sovrin.org/sdk/deb bionic stable"

# nodejs
# RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
# RUN /bin/bash -c "source /root/.nvm/nvm.sh && nvm install 18 && nvm use 18"

RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Verify the Node.js and npm installation
RUN node -v
RUN npm -v

# yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

# install depdencies
RUN apt-get update -y && apt-get install -y --allow-unauthenticated \
    libindy

RUN apt-get install yarn -y

# Install yarn seperately due to `no-install-recommends` to skip nodejs install 
RUN apt-get install -y --no-install-recommends yarn
 
RUN yarn global add patch-package
# AFJ specifc setup
WORKDIR /www

COPY apps/agent-provisioning/AFJ/afj-controller/bin ./bin
COPY apps/agent-provisioning/AFJ/afj-controller/patches ./patches
COPY apps/agent-provisioning/AFJ/afj-controller/package.json ./package.json
RUN yarn install --production

COPY apps/agent-provisioning/AFJ/afj-controller/build ./build
COPY apps/agent-provisioning/AFJ/afj-controller/libindy_vdr.so /usr/lib/
COPY apps/agent-provisioning/AFJ/afj-controller/libindy_vdr.so /usr/local/lib/

ENTRYPOINT [ "./bin/afj-rest.js", "start" ]
