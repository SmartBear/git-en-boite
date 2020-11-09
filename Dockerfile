FROM node:14.14.0

WORKDIR /app
COPY packages packages
COPY pacts pacts
COPY @types @types
COPY yarn.lock .
COPY package.json .
COPY .build-number .
COPY tsconfig.json .

ENV NODE_ENV=production

RUN yarn install
RUN yarn tsc --build 
RUN rm -rf packages/**/src

EXPOSE 3001
CMD yarn app start
