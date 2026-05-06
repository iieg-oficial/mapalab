import { useEffect } from 'react';

export const useViewSync = (paneMapRefs, active) => {
    useEffect(() => {
        if (!active || !paneMapRefs?.current) return undefined;

        let attempts = 0;
        let timeoutId = null;
        let m1Ref = null;
        let originalViewM1 = null;

        const tryAttach = () => {
            const refs = paneMapRefs.current;
            const m0 = refs?.[0]?.current;
            const m1 = refs?.[1]?.current;
            if (!m0 || !m1) {
                attempts += 1;
                if (attempts > 50) return;
                timeoutId = setTimeout(tryAttach, 50);
                return;
            }

            const sharedView = m0.getView();
            originalViewM1 = m1.getView();
            if (originalViewM1 !== sharedView) {
                m1.setView(sharedView);
            }
            m1Ref = m1;
        };

        tryAttach();

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (m1Ref && originalViewM1 && m1Ref.getView() !== originalViewM1) {
                try { m1Ref.setView(originalViewM1); } catch { /* m1 puede estar desmontado */ }
            }
        };
    }, [paneMapRefs, active]);
};
