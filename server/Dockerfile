FROM node:22-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ .
RUN npm run build
COPY server/src/db/schema.sql dist/db/
RUN mkdir -p /app/uploads
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/index.js"]
