import 'ol/ol.css';
import { useEffect, useState } from 'react';
import MapView from '@mapsComponents/MapView';
import MapAttribution from '@mapsComponents/MapAttribution';
import MapControls from '@mapsComponents/MapControls';
import ScaleLineControl from '@mapsComponents/ScaleLineControl';
import InfoBox from '@mapsComponents/InfoBox/InfoBox';
import LayerNotices from '@mapsComponents/LayerNotices/LayerNotices';
import Loading from '@components/Loading';
import { SiderProvider } from '@contexts/SiderContext';
import EmbedBrand from '@pages/embed/EmbedBrand';
import EmbedError from '@pages/embed/EmbedError';
import { fetchEmbedConfig } from '@services/embedService';
import { useEmbedActivation } from '@pages/embed/hooks/useEmbedActivation';
import { useEmbedFeatureRelay } from '@pages/embed/hooks/useEmbedFeatureRelay';
import { useEmbedMarker } from '@pages/embed/hooks/useEmbedMarker';
import { useEmbedTelemetry } from '@pages/embed/hooks/useEmbedTelemetry';
import { useEmbedViewSync } from '@pages/embed/hooks/useEmbedViewSync';
import { postError, postReady } from '@pages/embed/helpers/postMessage';


const EmbedInner = ({ params, config }) => {
    useEmbedActivation({ shareId: params.share, requestedLayers: params.layers });
    useEmbedFeatureRelay();
    useEmbedMarker({
        marker: params.marker,
        icon: params.markerIcon,
        color: params.markerColor,
        title: params.markerTitle,
        description: params.markerDescription,
    });
    useEmbedViewSync();
    const { markReady } = useEmbedTelemetry({ apiKey: params.key, enabled: Boolean(params.key) });
    useEffect(() => {
        postReady({
            institucion: config?.institucion || null,
            visibility: config?.visibility || null,
            requestedLayers: params.layers || [],
            share: params.share || null,
            capasPermitidas: config?.capasPermitidas || [],
        });
        markReady();
    }, [config, params.layers, params.share, markReady]);
    const noticesEnabled = params.notices !== 'false';
    return (
        <SiderProvider>
            <div className="relative w-full h-dvh">
                <MapView />
                <LayerNotices enabled={noticesEnabled} />
                <EmbedBrand params={params} />
                <InfoBox forceDesktop />
                <MapControls hideLocate />
                <ScaleLineControl />
                <MapAttribution hideActions />
            </div>
        </SiderProvider>
    );
};


const matchesAllowedDomain = (origin, pattern) => {
    if (!pattern || !origin) return false;
    const clean = String(pattern).replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    const originClean = origin.replace(/^https?:\/\//, '').toLowerCase();
    if (clean === '*') return true;
    if (clean === originClean) return true;
    if (clean.startsWith('*.')) {
        const base = clean.slice(2);
        return originClean === base || originClean.endsWith('.' + base);
    }
    return false;
};


const detectParentOrigin = () => {
    try {
        if (document.referrer) {
            const parsed = new URL(document.referrer);
            return `${parsed.protocol}//${parsed.host}`;
        }
    } catch { /* ignore */ }
    if (typeof window !== 'undefined' && window.parent !== window) {
        try {
            return window.location.origin;
        } catch { /* ignore */ }
    }
    return null;
};


const EmbedView = ({ params }) => {
    const [state, setState] = useState({ loading: true, error: null, config: null });

    useEffect(() => {
        let cancelled = false;
        if (!params.key) {
            const msg = 'Falta el parámetro "key" en la URL.';
            setState({ loading: false, error: msg, config: null });
            postError({ code: 'missing_key', message: msg });
            return undefined;
        }
        fetchEmbedConfig({ key: params.key, layers: params.layers })
            .then((config) => {
                if (cancelled) return;
                const allowed = Array.isArray(config?.dominiosPermitidos) ? config.dominiosPermitidos : [];
                if (allowed.length > 0) {
                    const parent = detectParentOrigin();
                    const sameOrigin = parent && parent === window.location.origin;
                    const allowedByList = parent && allowed.some((d) => matchesAllowedDomain(parent, d));
                    if (!sameOrigin && parent && !allowedByList) {
                        const msg = `Este sitio (${parent}) no está autorizado para mostrar el mapa con esta llave.`;
                        setState({ loading: false, error: msg, config: null });
                        postError({ code: 'origin_blocked_client', message: msg });
                        return;
                    }
                }
                setState({ loading: false, error: null, config });
            })
            .catch((err) => {
                if (cancelled) return;
                const msg = err?.message || 'Error desconocido';
                setState({ loading: false, error: msg, config: null });
                postError({ code: 'config_failed', message: msg });
            });
        return () => { cancelled = true; };
    }, [params.key, params.layers]);

    if (state.loading) {
        return (
            <div className="absolute inset-0 flex items-center justify-center">
                <Loading visible />
            </div>
        );
    }

    if (state.error) {
        return (
            <EmbedError
                title="No se pudo iniciar el visor"
                message={state.error}
            />
        );
    }

    return <EmbedInner params={params} config={state.config} />;
};

export default EmbedView;
