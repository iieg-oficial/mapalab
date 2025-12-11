FROM nginx:stable-alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy nginx configuration
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Environment variables for GeoServer
ENV GEOSERVER_HOST=localhost
ENV GEOSERVER_PORT=8080

EXPOSE 80

# Use envsubst to replace environment variables and start nginx
CMD ["/bin/sh", "-c", "envsubst '${GEOSERVER_HOST} ${GEOSERVER_PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
