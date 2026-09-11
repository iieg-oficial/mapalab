import { useMemo } from 'react';
import mapalabLarge from '@logos/mapalab_large.svg';
import { buildViewerUrl } from '@pages/embed/helpers/viewerUrl';

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
