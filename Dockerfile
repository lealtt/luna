FROM node:22-alpine

WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY . .

RUN pnpm install --prod

ENV NODE_ENV=production

CMD ["pnpm", "start"]

