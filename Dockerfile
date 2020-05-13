FROM node:14.0.0

WORKDIR /app
COPY packages packages
COPY yarn.lock .
COPY package.json .
WORKDIR /app/packages/la-boite
RUN yarn
RUN node_modules/.bin/tsc

EXPOSE 3001
CMD yarn start
