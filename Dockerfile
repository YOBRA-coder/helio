# One image, two processes: the web app and the 24/7 worker (see docker-compose.yml).
FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV NITRO_PRESET=node-server NODE_ENV=production
RUN npm run build
ENV HELIOS_DATA_DIR=/data PORT=3000 HOST=0.0.0.0
VOLUME /data
EXPOSE 3000
# default = web server; the worker service overrides this command
CMD ["node", ".output/server/index.mjs"]
