import { useCallback } from 'react';
import { useReportContext } from '@hooks/useReportContext';
import { trackColibriOpen } from '@services/analyticsService';

const SOURCE_APP = import.meta.env.VITE_COLIBRI_SOURCE_APP || 'mapalab';
const API_KEY = import.meta.env.VITE_COLIBRI_API_KEY || '';

if (typeof window !== 'undefined' && import.meta.env.DEV) {
    if (!API_KEY) {
        console.warn('[colibri] VITE_COLIBRI_API_KEY no esta seteada — ver .env.development');
    }
}


export const useColibriOpen = () => {
    const buildContext = useReportContext();

    return useCallback((extraContext = null, opcionesPanel = {}) => {
        if (typeof window === 'undefined') return false;
        if (!window.colibri || typeof window.colibri.openPanel !== 'function') {
            console.warn('Colibri widget no esta cargado todavia');
            return false;
        }

        try {
            const ctx = buildContext(extraContext);
            const sc = ctx?.sourceContext || {};
            window.colibri.clearContext?.();
            if (sc.app_version) window.colibri.setContext?.('app_version', sc.app_version);
            if (sc.map) window.colibri.setContext?.('map', sc.map);
            if (sc.referrer) window.colibri.setContext?.('referrer', sc.referrer);
            if (extraContext && typeof extraContext === 'object') {
                for (const [k, v] of Object.entries(extraContext)) {
                    window.colibri.setContext?.(k, v);
                }
            }
        } catch {
            /* noop */
        }

        window.colibri.openPanel({
            sourceApp: SOURCE_APP,
            apiKey: API_KEY,
            ...opcionesPanel,
        });
        trackColibriOpen(extraContext?.motivo || extraContext?.source || 'reporte', opcionesPanel.tipoDefault || null);
        return true;
    }, [buildContext]);
};
