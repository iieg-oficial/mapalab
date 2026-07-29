(function() {
    var ATTEMPTS_KEY = 'mapalab:reload-attempts';
    var MAX_ATTEMPTS = 2;

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

    function report(type, failedUrl, detail) {
        try {
            var apiBase = (location.pathname.indexOf('/mapalab/') === 0) ? '/mapalab/api/' : '/api/';
            var beaconUrl = (location.origin || '') + apiBase + 'log/client-error';
            var body = JSON.stringify({
                type: type,
                url: String(failedUrl).slice(0, 2000),
                message: String(detail || '').slice(0, 500),
                userAgent: String(navigator.userAgent || '').slice(0, 500),
                href: String(location.href || '').slice(0, 2000)
            });
            if (navigator.sendBeacon) {
                navigator.sendBeacon(beaconUrl, new Blob([body], { type: 'application/json' }));
            }
        } catch (e) {}
    }

    function showFatal(failedUrl) {
        report('chunk_load_error_fatal', failedUrl, 'agotados ' + MAX_ATTEMPTS + ' reintentos');
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
                clearAttempts();
                window.location.reload();
            });
        }
    }

    function handleChunkError(event) {
        var payload = event && event.payload;
        var failedUrl = (payload && payload.src) || (payload && payload.href) || (event && event.message) || 'unknown';
        var attempts = readAttempts();
        console.error('[mapalab] chunk load error', { url: failedUrl, attempts: attempts, href: location.href });

        if (attempts >= MAX_ATTEMPTS) {
            showFatal(failedUrl);
            return;
        }

        report('chunk_load_error', failedUrl, 'reintento ' + (attempts + 1));
        writeAttempts(attempts + 1);
        window.location.reload();
    }

    window.addEventListener('load', function() {
        window.setTimeout(function() {
            var root = document.getElementById('root');
            if (root && root.childElementCount > 0) clearAttempts();
        }, 5000);
    });

    window.addEventListener('vite:preloadError', handleChunkError);

    window.addEventListener('error', function(event) {
        var target = event.target;
        if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
            var src = target.src || target.href;
            if (src && (src.indexOf('/assets/') !== -1 || src.indexOf('/mapalab/assets/') !== -1)) {
                handleChunkError({ payload: { src: src } });
            }
        }
    }, true);

    window.addEventListener('unhandledrejection', function(event) {
        var reason = event && event.reason;
        var msg = reason && (reason.message || String(reason));
        if (msg && /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(msg)) {
            handleChunkError({ message: msg });
        }
    });
})();
