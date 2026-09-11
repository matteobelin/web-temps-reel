FROM node:24

WORKDIR /app

COPY shared ./shared
COPY backend ./backend

WORKDIR /app/shared
RUN npm install
RUN npm run build

WORKDIR /app/backend
RUN npm install

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]