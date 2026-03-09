location ^~ /geoserver/web {
    include /etc/nginx/allowed_ips.conf;
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
    include /etc/nginx/allowed_ips.conf;
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

location ^~ /geoserver/j_spring_security {
    include /etc/nginx/allowed_ips.conf;
    deny all;
    proxy_pass http://geoserver/geoserver/j_spring_security;
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
    location ~ ^/geoserver/ows {
        valid_referers server_names *.$host $host localhost;
        if ($invalid_referer) {
            return 403;
        }

        if ($http_user_agent ~* (curl|wget|python|scrapy|httpclient|bot|spider|java|perl|ruby|php|go-http|node-fetch|axios|postman)) {
            return 403;
        }

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

        proxy_cache geoserver_cache;
        proxy_cache_key "$request_uri$arg_outputFormat";
        proxy_cache_valid 200 6h;
        proxy_cache_lock on;
        proxy_cache_lock_timeout 10s;
        proxy_cache_use_stale error timeout updating;
        proxy_ignore_headers "Set-Cookie" "Expires" "Cache-Control";
        proxy_no_cache $geoserver_no_cache;
        proxy_cache_bypass $geoserver_no_cache;
        add_header X-Cache-Status $upstream_cache_status always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;

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

    location ~ ^/geoserver/(wfs|wcs) {
        valid_referers server_names *.$host $host localhost;
        if ($invalid_referer) {
            return 403;
        }

        if ($http_user_agent ~* (curl|wget|python|scrapy|httpclient|bot|spider|java|perl|ruby|php|go-http|node-fetch|axios|postman)) {
            return 403;
        }

        limit_req zone=geoserver_download burst=10 nodelay;
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

        proxy_cache geoserver_cache;
        proxy_cache_key "$request_uri$arg_outputFormat";
        proxy_cache_valid 200 6h;
        proxy_cache_lock on;
        proxy_cache_lock_timeout 10s;
        proxy_cache_use_stale error timeout updating;
        proxy_ignore_headers "Set-Cookie" "Expires" "Cache-Control";
        proxy_no_cache $geoserver_no_cache;
        proxy_cache_bypass $geoserver_no_cache;
        add_header X-Cache-Status $upstream_cache_status always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;

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
    proxy_read_timeout    120s;
}

location /geoserver-error/ {
    alias /etc/nginx/error-pages/;
    internal;
}
