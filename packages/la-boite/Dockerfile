FROM node:lts

WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn install

EXPOSE 3001
CMD [ "yarn", "start" ]
