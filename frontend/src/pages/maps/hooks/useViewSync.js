import { useEffect } from 'react';

export const useViewSync = (paneMapRefs, active) => {
    useEffect(() => {
        if (!active || !paneMapRefs?.current) return undefined;

        let attempts = 0;
        let cleanup = null;
        const tryAttach = () => {
            const refs = paneMapRefs.current;
            const m0 = refs?.[0]?.current;
            const m1 = refs?.[1]?.current;
            if (!m0 || !m1) {
                attempts += 1;
                if (attempts > 50) return;
                const t = setTimeout(tryAttach, 50);
                cleanup = () => clearTimeout(t);
                return;
            }

            const v0 = m0.getView();
            const v1 = m1.getView();
            v1.setCenter(v0.getCenter());
            v1.setZoom(v0.getZoom());
            v1.setRotation(v0.getRotation());

            let syncing = false;
            const sync = (from, to) => () => {
                if (syncing) return;
                syncing = true;
                to.setCenter(from.getCenter());
                to.setZoom(from.getZoom());
                to.setRotation(from.getRotation());
                syncing = false;
            };

            const h01 = sync(v0, v1);
            const h10 = sync(v1, v0);
            v0.on('change:center', h01);
            v0.on('change:resolution', h01);
            v0.on('change:rotation', h01);
            v1.on('change:center', h10);
            v1.on('change:resolution', h10);
            v1.on('change:rotation', h10);

            cleanup = () => {
                v0.un('change:center', h01);
                v0.un('change:resolution', h01);
                v0.un('change:rotation', h01);
                v1.un('change:center', h10);
                v1.un('change:resolution', h10);
                v1.un('change:rotation', h10);
            };
        };

        tryAttach();
        return () => {
            if (cleanup) cleanup();
        };
    }, [paneMapRefs, active]);
};
