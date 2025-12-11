FROM nginx:stable-alpine
RUN apk add --no-cache gettext
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["/bin/sh", "-c", "envsubst '${GEOSERVER_HOST} ${GEOSERVER_PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
