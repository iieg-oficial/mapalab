FROM nginx:stable-alpine
COPY nginx-main.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
ENV SEO_ENABLED=false
EXPOSE 80
CMD ["/bin/sh", "-c", "envsubst '${SEO_ENABLED}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
