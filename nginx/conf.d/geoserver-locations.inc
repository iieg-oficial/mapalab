location ^~ /geoserver/web {
    allow ${ALLOWED_IP};
    deny all;
    proxy_pass http://geoserver/geoserver/web;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Accept-Encoding identity;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_connect_timeout 60s;
    proxy_send_timeout    60s;
    proxy_read_timeout    60s;
}

location ^~ /geoserver/rest {
    allow ${ALLOWED_IP};
    deny all;
    proxy_pass http://geoserver/geoserver/rest;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Accept-Encoding identity;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_connect_timeout 60s;
    proxy_send_timeout    60s;
    proxy_read_timeout    60s;
}

location ^~ /geoserver/ {
    limit_req zone=geoserver_limit burst=20 nodelay;
    limit_conn geoserver_conn 4;

    location ~ ^/geoserver/(ows|wfs|wcs) {
        valid_referers server_names *.$host $host localhost;
        if ($invalid_referer) {
            return 403;
        }

        if ($http_user_agent ~* (curl|wget|python|scrapy|httpclient|bot|spider|java|perl|ruby|php|go-http|node-fetch|axios|postman)) {
            return 403;
        }

        limit_req zone=geoserver_download burst=4 nodelay;
        limit_conn geoserver_conn 2;
        proxy_pass http://geoserver;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Accept-Encoding identity;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_connect_timeout 60s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;
        proxy_buffer_size   32k;
        proxy_buffers       8 32k;
        proxy_busy_buffers_size 64k;
        proxy_hide_header Cache-Control;
        proxy_hide_header Pragma;
        add_header Cache-Control $geoserver_cache_control;

        proxy_intercept_errors on;
        error_page 400 /geoserver-error/400.html;
        error_page 401 /geoserver-error/401.html;
        error_page 403 /geoserver-error/403.html;
        error_page 404 /geoserver-error/404.html;
        error_page 500 502 503 504 /geoserver-error/500.html;

        if ($arg_request ~* "Transaction") {
            return 403;
        }
    }

    proxy_pass http://geoserver/geoserver/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Accept-Encoding identity;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_connect_timeout 60s;
    proxy_send_timeout    60s;
    proxy_read_timeout    60s;
    proxy_buffer_size   32k;
    proxy_buffers       8 32k;
    proxy_busy_buffers_size 64k;
    proxy_hide_header Cache-Control;
    proxy_hide_header Pragma;
    add_header Cache-Control $geoserver_cache_control;

    proxy_intercept_errors on;
    error_page 400 /geoserver-error/400.html;
    error_page 401 /geoserver-error/401.html;
    error_page 403 /geoserver-error/403.html;
    error_page 404 /geoserver-error/404.html;
    error_page 500 502 503 504 /geoserver-error/500.html;

    if ($arg_request ~* "Transaction") {
        return 403;
    }
}

location /geoserver-error/ {
    alias /etc/nginx/error-pages/;
    internal;
}
