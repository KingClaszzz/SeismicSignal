FROM node:20-slim

ENV NODE_ENV=development

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --include=dev

COPY backend/ .

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

RUN npm run build

EXPOSE 7860
ENV NODE_ENV=production
ENV PORT=7860

CMD ["npm", "start"]
