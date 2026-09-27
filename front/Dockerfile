FROM node:24-alpine AS build

WORKDIR /app


COPY shared ./shared
COPY front ./front


WORKDIR /app/shared
RUN npm install --no-package-lock
RUN npm run build


WORKDIR /app/front
RUN npm install --no-package-lock
RUN npm run build -- --configuration production


FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY front/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/front/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
