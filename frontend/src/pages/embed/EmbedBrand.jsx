import { useMemo } from 'react';
import mapalabLarge from '@logos/mapalab_large.svg';

const buildViewerUrl = ({ share, layers, center, marker, zoom }) => {
    const path = window.location.pathname.replace(/\/embed\/?$/, '/mapa');
    const qs = new URLSearchParams();
    if (share) {
        qs.set('s', share);
    } else {
        if (layers?.length) qs.set('layers', layers.join(','));
        if (center) qs.set('center', center.join(','));
        if (marker) qs.set('marker', marker.join(','));
    }
    if (zoom) qs.set('zoom', String(zoom));
    const search = qs.toString();
    return search ? `${path}?${search}` : path;
};

const EmbedBrand = ({ params }) => {
    const href = useMemo(() => buildViewerUrl(params), [params]);

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir en MapaLab"
            className="absolute top-3 left-3 z-[4] flex items-center rounded-[12px] bg-white/90 px-2 py-1 shadow-[0_2px_4px_0_rgba(0,0,0,0.10)] transition-colors hover:bg-white md:px-3 md:py-1.5"
        >
            <img src={mapalabLarge} alt="MapaLab — IIEG" className="h-5 w-auto md:h-7" />
        </a>
    );
};

export default EmbedBrand;
