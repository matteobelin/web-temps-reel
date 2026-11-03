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

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
