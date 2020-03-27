FROM node:lts

WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn install

COPY bin bin
COPY cucumber.js .
COPY .eslintrc.js .
COPY .mocharc.json .
COPY .prettierrc.js .
COPY tsconfig.json .
COPY src src
COPY features features
RUN node_modules/.bin/tsc

EXPOSE 3001
CMD [ "yarn", "start" ]
