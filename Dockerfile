FROM node:15.0.1

WORKDIR /app
COPY packages packages
COPY pacts pacts
COPY @types @types
COPY yarn.lock .
COPY package.json .
COPY .build-number .
COPY tsconfig.json .

RUN yarn install
RUN rm -rf **/*.spec.ts
RUN rm -rf packages/app/features
RUN yarn tsc --build && rm -rf packages/**/src

EXPOSE 3001
CMD yarn app start
