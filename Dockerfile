FROM node:14.4.0

WORKDIR /app
COPY packages packages
COPY yarn.lock .
COPY package.json .
WORKDIR /app/packages/app
RUN yarn
RUN yarn lint

EXPOSE 3001
CMD yarn start
