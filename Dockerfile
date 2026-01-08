FROM node:20-alpine

WORKDIR /usr/src/app

RUN apk add --no-cache netcat-openbsd

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

COPY docker-entrypoint.sh /usr/src/app/docker-entrypoint.sh

ENTRYPOINT ["sh", "/usr/src/app/docker-entrypoint.sh"]

CMD ["yarn", "start:debug"]