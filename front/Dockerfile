FROM node:24-alpine AS build

WORKDIR /app


COPY shared ./shared
COPY front ./front


WORKDIR /app/shared
RUN npm ci
RUN npm run build


WORKDIR /app/front
RUN npm ci
RUN npm run build


FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY front/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/front/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget --spider -q http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
