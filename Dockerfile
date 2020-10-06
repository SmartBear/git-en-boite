FROM node:14.11.0

WORKDIR /app
COPY packages packages
COPY pacts pacts
COPY @types @types
COPY yarn.lock .
COPY package.json .
COPY .build-number .
RUN yarn
RUN yarn lint && rm -rf packages/**/src

EXPOSE 3001
CMD yarn app start
