FROM node:24-alpine

WORKDIR /app

COPY --chown=node:node shared ./shared
COPY --chown=node:node backend ./backend

USER node

WORKDIR /app/shared
RUN npm ci
RUN npm run build

WORKDIR /app/backend
RUN npm ci

RUN npx prisma generate
RUN npm run build
RUN cp -r generated dist/generated

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/v1/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/src/main.js"]