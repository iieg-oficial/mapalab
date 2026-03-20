FROM nginx:stable-alpine
RUN apk add --no-cache gettext
COPY nginx.base.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY nginx.ssl.conf /etc/nginx/templates/ssl.conf.template
COPY conf.d/ /etc/nginx/templates/conf.d/
COPY includes/ /etc/nginx/includes/
COPY entrypoint.sh /entrypoint.sh
RUN mkdir -p /etc/nginx/certs /var/cache/nginx/geoserver
EXPOSE 80 443
ENTRYPOINT ["/entrypoint.sh"]
