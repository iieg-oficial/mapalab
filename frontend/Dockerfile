FROM node:24-alpine AS builder
WORKDIR /app

ARG VITE_GOOGLE_ANALYTICS_ID
ARG VITE_BACKEND_API_HOST
ARG VITE_GEOSERVER_URL
ARG VITE_NODE_ENV
ARG VITE_BASE_PATH=/

ENV VITE_GOOGLE_ANALYTICS_ID=${VITE_GOOGLE_ANALYTICS_ID}
ENV VITE_BACKEND_API_HOST=${VITE_BACKEND_API_HOST}
ENV VITE_GEOSERVER_URL=${VITE_GEOSERVER_URL}
ENV VITE_NODE_ENV=${VITE_NODE_ENV}
ENV VITE_BASE_PATH=${VITE_BASE_PATH}

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine

ARG MAPALAB_BACKEND_URL
ARG CORS_ALLOWED_ORIGIN

COPY nginx.conf /etc/nginx/conf.d/default.conf.template

RUN apk add --no-cache gettext && \
    export MAPALAB_BACKEND_URL=${MAPALAB_BACKEND_URL} && \
    export CORS_ALLOWED_ORIGIN=${CORS_ALLOWED_ORIGIN} && \
    envsubst '${MAPALAB_BACKEND_URL} ${CORS_ALLOWED_ORIGIN}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && \
    rm /etc/nginx/conf.d/default.conf.template && \
    apk del gettext

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
