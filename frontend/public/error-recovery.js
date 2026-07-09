(function() {
    var RELOAD_KEY = 'mapalab:reload';
    function isReloading() {
        try { return window.sessionStorage.getItem(RELOAD_KEY) === '1'; } catch (e) { return false; }
    }
    function markReloading() {
        try { window.sessionStorage.setItem(RELOAD_KEY, '1'); } catch (e) {}
    }
    if (isReloading()) {
        try { window.sessionStorage.removeItem(RELOAD_KEY); } catch (e) {}
        return;
    }
    function handleChunkError(event) {
        var payload = event && event.payload;
        var failedUrl = (payload && payload.src) || (payload && payload.href) || (event && event.message) || 'unknown';
        var ua = navigator.userAgent || '';
        var href = location.href || '';
        console.error('[mapalab] chunk load error, reloading', { url: failedUrl, ua: ua, href: href });
        try {
            var apiBase = (location.pathname.indexOf('/mapalab/') === 0) ? '/mapalab/api/' : '/api/';
            var beaconUrl = (location.origin || '') + apiBase + 'log/client-error';
            var payload = JSON.stringify({ type: 'chunk_load_error', url: String(failedUrl).slice(0, 2000), userAgent: String(ua).slice(0, 500), href: String(href).slice(0, 2000) });
            navigator.sendBeacon && navigator.sendBeacon(beaconUrl, payload);
        } catch (e) {}
        markReloading();
        window.location.reload();
    }
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
