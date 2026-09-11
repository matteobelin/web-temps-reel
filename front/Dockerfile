FROM node:24 AS build

WORKDIR /app


COPY shared ./shared
COPY front ./front


WORKDIR /app/shared
RUN npm install
RUN npm run build


WORKDIR /app/front
RUN npm install


RUN npm run build -- --configuration production


FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*


COPY --from=build /app/front/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
