FROM nginx:stable-alpine
RUN apk add --no-cache gettext
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY nginx.ssl.conf /etc/nginx/templates/ssl.conf.template
RUN mkdir -p /etc/nginx/certs
COPY error/ /usr/share/nginx/html/error/
EXPOSE 80 443
CMD ["/bin/sh", "-c", "if [ \"${SSL_MODE}\" = 'true' ]; then envsubst '${BACKEND_HOST} ${GEOSERVER_HOST} ${APP_DOMAIN} ${SSL_CERTIFICATE} ${SSL_CERTIFICATE_KEY} ${ALLOWED_IP}' < /etc/nginx/templates/ssl.conf.template > /etc/nginx/conf.d/default.conf; else envsubst '${BACKEND_HOST} ${GEOSERVER_HOST}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf; fi && nginx -g 'daemon off;'"]
