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
            className="absolute top-3 left-3 z-[4] flex h-10 items-center rounded-[20px] bg-white px-2 shadow-[0_5px_20px_#1A26641A]"
        >
            <img src={mapalabLarge} alt="MapaLab — IIEG" className="h-6 w-auto" />
        </a>
    );
};

export default EmbedBrand;
