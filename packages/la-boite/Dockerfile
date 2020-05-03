FROM node:14.0.0

WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install

COPY bin bin
COPY cucumber.js .
COPY .eslintrc.js .
COPY .mocharc.js .
COPY .prettierrc.js .
COPY tsconfig.json .
COPY src src
COPY features features
COPY .build-number .
RUN node_modules/.bin/tsc

EXPOSE 3001
CMD npm start
