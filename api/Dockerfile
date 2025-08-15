FROM node:20.16.0-alpine3.22.1
WORKDIR /app
COPY package*.json ./
RUN apk update && apk upgrade && npm ci --omit-dev
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]