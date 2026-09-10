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
            className="absolute bottom-13 right-4 md:bottom-10 md:right-2 z-[4] flex flex-col items-center rounded-[6px] px-1.5 py-1 md:px-0 backdrop-blur-md"
        >
            <img src={mapalabLarge} alt="MapaLab — IIEG" className="h-3 w-auto md:h-auto md:w-0 md:min-w-full" />
            <span aria-hidden="true" className="hidden md:block h-0 overflow-hidden px-3 font-[Garet,sans-serif] font-medium text-[12px] tracking-[0px] whitespace-nowrap">
                Contribuciones ©
            </span>
        </a>
    );
};

export default EmbedBrand;
