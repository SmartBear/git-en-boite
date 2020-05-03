FROM node:14.0.0

WORKDIR /app
COPY packages .
WORKDIR /app/la-boite
RUN npm install
RUN node_modules/.bin/tsc

EXPOSE 3001
CMD npm start
