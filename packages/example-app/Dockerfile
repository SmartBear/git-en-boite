FROM node:lts

WORKDIR /app
COPY package*.json ./
RUN yarn install

EXPOSE 3000
CMD [ "yarn", "start" ]
