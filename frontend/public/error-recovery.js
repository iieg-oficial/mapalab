(function() {
    var ATTEMPTS_KEY = 'mapalab:reload-attempts';
    var MAX_ATTEMPTS = 2;
    var BURST_MS = 2000;
    var RELOAD_FALLBACK_MS = 3000;
    var lastHandledAt = 0;

    function readAttempts() {
        try {
            var parsed = parseInt(window.sessionStorage.getItem(ATTEMPTS_KEY), 10);
            return isNaN(parsed) ? 0 : parsed;
        } catch (e) {
            return 0;
        }
    }

    function writeAttempts(value) {
        try { window.sessionStorage.setItem(ATTEMPTS_KEY, String(value)); } catch (e) {}
    }

    function clearAttempts() {
        try { window.sessionStorage.removeItem(ATTEMPTS_KEY); } catch (e) {}
    }

    function describeError(err) {
        if (!err) return '';
        if (typeof err === 'string') return err;
        var name = err.name || 'Error';
        var message = err.message || String(err);
        return name + ': ' + message;
    }

    function describeTarget(target) {
        var parts = [String(target.tagName || '').toLowerCase()];
        if (target.rel) parts.push('rel=' + target.rel);
        if (target.type) parts.push('type=' + target.type);
        return parts.join(' ');
    }

    function extractUrl(text) {
        var match = String(text || '').match(/https?:\/\/[^\s'")]+/);
        return match ? match[0] : '';
    }

    function report(type, failedUrl, detail) {
        try {
            var apiBase = (location.pathname.indexOf('/mapalab/') === 0) ? '/mapalab/api/' : '/api/';
            var beaconUrl = (location.origin || '') + apiBase + 'log/client-error';
            var body = JSON.stringify({
                type: type,
                url: String(failedUrl || '').slice(0, 2000),
                message: String(detail || '').slice(0, 500),
                userAgent: String(navigator.userAgent || '').slice(0, 500),
                href: String(location.href || '').slice(0, 2000)
            });
            if (navigator.sendBeacon) {
                navigator.sendBeacon(beaconUrl, new Blob([body], { type: 'application/json' }));
            }
        } catch (e) {}
    }

    function revalidateAndReload(failedUrl) {
        var reloaded = false;

        function go() {
            if (reloaded) return;
            reloaded = true;
            window.location.reload();
        }

        window.setTimeout(go, RELOAD_FALLBACK_MS);

        try {
            if (!window.fetch) { go(); return; }
            var urls = [location.href];
            if (failedUrl && failedUrl.indexOf('http') === 0) urls.push(failedUrl);
            var pending = urls.length;
            urls.forEach(function(url) {
                window.fetch(url, { cache: 'reload' })
                    .catch(function() {})
                    .then(function() {
                        pending -= 1;
                        if (pending <= 0) go();
                    });
            });
        } catch (e) {
            go();
        }
    }

    function showFatal(failedUrl, detail) {
        report('chunk_load_error_fatal', failedUrl, detail);
        var root = document.getElementById('root');
        if (!root || root.childElementCount > 0) return;
        root.innerHTML = '<div style="min-height:100vh;display:flex;flex-direction:column;'
            + 'align-items:center;justify-content:center;text-align:center;padding:24px;'
            + 'font-family:system-ui,sans-serif;color:#2E4372;'
            + 'background:linear-gradient(180deg,#FFFFFF 0%,#F7F0FA 100%)">'
            + '<h1 style="font-size:28px;font-weight:700;margin-bottom:16px">No pudimos cargar MapaLab</h1>'
            + '<p style="font-size:16px;max-width:34rem;margin-bottom:24px">'
            + 'Tu navegador guardó una versión anterior de la aplicación. '
            + 'Recarga forzando la actualización con Ctrl+F5 (Cmd+Shift+R en Mac).</p>'
            + '<button id="mapalab-hard-reload" style="padding:12px 40px;border-radius:30px;'
            + 'background:#703089;color:#fff;border:none;font-weight:700;cursor:pointer">'
            + 'Recargar ahora</button></div>';
        var button = document.getElementById('mapalab-hard-reload');
        if (button) {
            button.addEventListener('click', function() {
                button.disabled = true;
                button.textContent = 'Recargando…';
                clearAttempts();
                revalidateAndReload(failedUrl);
            });
        }
    }

    function handleChunkError(info) {
        var now = Date.now();
        if (now - lastHandledAt < BURST_MS) return;
        lastHandledAt = now;

        var failedUrl = (info && info.url) || 'unknown';
        var detail = (info && info.detail) || '';
        var attempts = readAttempts();
        console.error('[mapalab] chunk load error', {
            url: failedUrl,
            detail: detail,
            attempts: attempts,
            href: location.href
        });

        if (attempts >= MAX_ATTEMPTS) {
            showFatal(failedUrl, detail);
            return;
        }

        report('chunk_load_error', failedUrl, detail);
        writeAttempts(attempts + 1);
        window.location.reload();
    }

    window.addEventListener('load', function() {
        window.setTimeout(function() {
            var root = document.getElementById('root');
            if (root && root.childElementCount > 0) clearAttempts();
        }, 5000);
    });

    window.addEventListener('vite:preloadError', function(event) {
        var payload = event && event.payload;
        var url = (payload && (payload.src || payload.href))
            || extractUrl(payload && payload.message)
            || 'unknown';
        handleChunkError({ url: url, detail: 'vite:preloadError ' + describeError(payload) });
    });

    window.addEventListener('error', function(event) {
        var target = event.target;
        if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
            var src = target.src || target.href;
            if (src && (src.indexOf('/assets/') !== -1 || src.indexOf('/mapalab/assets/') !== -1)) {
                handleChunkError({ url: src, detail: 'elemento ' + describeTarget(target) });
            }
        }
    }, true);

    window.addEventListener('unhandledrejection', function(event) {
        var reason = event && event.reason;
        var msg = reason && (reason.message || String(reason));
        if (msg && /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(msg)) {
            handleChunkError({
                url: extractUrl(msg) || 'unknown',
                detail: 'unhandledrejection ' + describeError(reason)
            });
        }
    });
})();
