FROM node:lts

WORKDIR /app
COPY package*.json ./
RUN yarn install

EXPOSE 3001
CMD [ "yarn", "start" ]
