FROM node:16.13.2

WORKDIR /app

COPY @types @types
COPY package.json .
COPY packages packages
COPY tsconfig.json .
COPY yarn.lock .

RUN yarn install --production

ARG git_ref
ENV git_ref=$git_ref
ARG build_number
ENV build_number=$build_number

RUN yarn build
RUN rm -rf packages/**/src

EXPOSE 3001

CMD yarn start
