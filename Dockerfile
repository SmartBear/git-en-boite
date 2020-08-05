FROM node:14.5.0

WORKDIR /app
COPY packages packages
COPY pacts pacts
COPY yarn.lock .
COPY package.json .
COPY .build-number .
RUN yarn
RUN yarn lint

EXPOSE 3001
CMD yarn app start
