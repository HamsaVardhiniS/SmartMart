FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build


FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/src/prisma ./src/prisma

EXPOSE 4006

CMD ["node", "dist/server.js"]
