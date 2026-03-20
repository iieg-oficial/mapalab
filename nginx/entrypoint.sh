#!/bin/sh
set -e

echo '' > /etc/nginx/allowed_ips.conf
for ip in ${ALLOWED_IP}; do
    echo "allow $ip;" >> /etc/nginx/allowed_ips.conf
done

if [ "${SSL_MODE}" = 'true' ]; then
    for f in /etc/nginx/templates/conf.d/*; do
        envsubst '${GEOSERVER_HOST}' < "$f" > /etc/nginx/conf.d/$(basename "$f")
    done

    envsubst '${BACKEND_HOST} ${GEOSERVER_HOST} ${APP_DOMAIN} ${SSL_CERTIFICATE} ${SSL_CERTIFICATE_KEY}' \
        < /etc/nginx/templates/ssl.conf.template \
        > /etc/nginx/conf.d/default.conf
else
    rm -f /etc/nginx/conf.d/geoserver.conf

    envsubst '${BACKEND_HOST}' \
        < /etc/nginx/templates/default.conf.template \
        > /etc/nginx/conf.d/default.conf
fi

exec nginx -g 'daemon off;'
