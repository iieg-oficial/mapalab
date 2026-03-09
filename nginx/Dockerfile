FROM nginx:stable-alpine
RUN apk add --no-cache gettext
COPY nginx.base.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY nginx.ssl.conf /etc/nginx/templates/ssl.conf.template
COPY conf.d/ /etc/nginx/templates/conf.d/
RUN mkdir -p /etc/nginx/certs /var/cache/nginx/geoserver
EXPOSE 80 443
CMD ["/bin/sh", "-c", "echo '' > /etc/nginx/allowed_ips.conf && for ip in ${ALLOWED_IP}; do echo \"allow $ip;\" >> /etc/nginx/allowed_ips.conf; done && for f in /etc/nginx/templates/conf.d/*; do envsubst '${GEOSERVER_HOST}' < \"$f\" > /etc/nginx/conf.d/$(basename $f); done && if [ \"${SSL_MODE}\" = 'true' ]; then envsubst '${BACKEND_HOST} ${GEOSERVER_HOST} ${APP_DOMAIN} ${SSL_CERTIFICATE} ${SSL_CERTIFICATE_KEY}' < /etc/nginx/templates/ssl.conf.template > /etc/nginx/conf.d/default.conf; else envsubst '${BACKEND_HOST} ${GEOSERVER_HOST}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf; fi && nginx -g 'daemon off;'"]
