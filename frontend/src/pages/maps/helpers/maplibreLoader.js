let pending = null;

export const loadMaplibre = () => {
    if (!pending) {
        pending = Promise.all([
            import('maplibre-gl'),
            import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
            import('maplibre-gl/dist/maplibre-gl.css'),
        ]).then(([maplibregl, worker]) => {
            maplibregl.setWorkerUrl(worker.default);
            return maplibregl;
        }).catch((error) => {
            pending = null;
            throw error;
        });
    }
    return pending;
};
