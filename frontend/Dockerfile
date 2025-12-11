FROM node:24-alpine AS builder
WORKDIR /app

ARG VITE_GOOGLE_ANALYTICS_ID
ARG VITE_BACKEND_API_HOST
ARG VITE_GEOSERVER_URL
ARG VITE_NODE_ENV

ENV VITE_GOOGLE_ANALYTICS_ID=${VITE_GOOGLE_ANALYTICS_ID}
ENV VITE_BACKEND_API_HOST=${VITE_BACKEND_API_HOST}
ENV VITE_GEOSERVER_URL=${VITE_GEOSERVER_URL}
ENV VITE_NODE_ENV=${VITE_NODE_ENV}

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine

ARG VITE_BACKEND_API_HOST
ARG VITE_GEOSERVER_URL

COPY nginx.conf /etc/nginx/conf.d/default.conf.template

RUN apk add --no-cache gettext && \
    export VITE_BACKEND_API_HOST=${VITE_BACKEND_API_HOST} && \
    export VITE_GEOSERVER_URL=${VITE_GEOSERVER_URL} && \
    envsubst '${VITE_BACKEND_API_HOST} ${VITE_GEOSERVER_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && \
    rm /etc/nginx/conf.d/default.conf.template && \
    apk del gettext

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
