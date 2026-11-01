FROM node:24-alpine
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

RUN npm install -g pnpm@11.15.1 --force
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install

COPY . .
RUN chmod +x ./docker-entrypoint.sh
RUN pnpm build

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
