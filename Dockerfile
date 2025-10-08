FROM node:22-alpine

WORKDIR /usr/src/app

RUN npm install -g pnpm@10.18.0

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod

COPY dist ./dist
COPY locales ./locales
COPY .env ./.env

CMD ["node", "--env-file", ".env", "dist/index.js"]
