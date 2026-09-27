FROM node:24-alpine

WORKDIR /app

COPY shared ./shared
COPY backend ./backend

WORKDIR /app/shared
RUN npm install --no-package-lock
RUN npm run build

WORKDIR /app/backend
RUN npm install --no-package-lock

RUN npx prisma generate
RUN npm run build
RUN cp -r generated dist/generated

EXPOSE 3000

CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && node dist/src/main.js"]