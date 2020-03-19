FROM node:lts

WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn install

COPY bin bin
COPY tsconfig.json .
COPY cucumber.js .
COPY src src
COPY features features
RUN node_modules/.bin/tsc

EXPOSE 3001
CMD [ "yarn", "start" ]
