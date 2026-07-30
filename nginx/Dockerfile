# syntax=docker/dockerfile:1
FROM node:24-alpine AS widget_builder

WORKDIR /app

COPY widget/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY widget/ .

RUN npm run build && cp dist/mapalab.v1.js dist/mapalab.js

FROM node:24-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY frontend/ .

ARG VITE_BASE_PATH=/mapalab/
ARG VITE_BACKEND_API_HOST=/mapalab/api/
ARG VITE_GEOSERVER_URL=/geoserver/
ARG VITE_SITE_URL=
ARG VITE_NODE_ENV=production
ARG VITE_APP_ENV=beta
ARG VITE_COLIBRI_SOURCE_APP=mapalab
ARG VITE_COLIBRI_API_KEY=
ARG VITE_ACERVO_ORIGIN=

ENV VITE_BASE_PATH=$VITE_BASE_PATH \
    VITE_BACKEND_API_HOST=$VITE_BACKEND_API_HOST \
    VITE_GEOSERVER_URL=$VITE_GEOSERVER_URL \
    VITE_SITE_URL=$VITE_SITE_URL \
    VITE_NODE_ENV=$VITE_NODE_ENV \
    VITE_APP_ENV=$VITE_APP_ENV \
    VITE_COLIBRI_SOURCE_APP=$VITE_COLIBRI_SOURCE_APP \
    VITE_COLIBRI_API_KEY=$VITE_COLIBRI_API_KEY \
    VITE_ACERVO_ORIGIN=$VITE_ACERVO_ORIGIN

RUN npm run build

FROM nginx:1.30.4-alpine
COPY nginx/nginx-main.conf /etc/nginx/nginx.conf
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=widget_builder /app/dist /usr/share/nginx/html/widget/v1
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
