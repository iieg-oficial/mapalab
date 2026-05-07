import { useEffect } from 'react';

export const useViewSync = (paneMapInstances, active) => {
    useEffect(() => {
        if (!active) return undefined;
        const m0 = paneMapInstances?.[0];
        const m1 = paneMapInstances?.[1];
        if (!m0 || !m1) return undefined;

        const sharedView = m0.getView();
        const originalViewM1 = m1.getView();
        if (originalViewM1 !== sharedView) {
            m1.setView(sharedView);
        }

        return () => {
            try {
                if (m1.getView() !== originalViewM1) m1.setView(originalViewM1);
            } catch { /* m1 puede estar desmontado */ }
        };
    }, [paneMapInstances, active]);
};
