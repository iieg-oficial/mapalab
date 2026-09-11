import { useMemo } from 'react';
import mapalabLarge from '@logos/mapalab_large.svg';
import mapalabShort from '@logos/mapalab_short.svg';
import { buildViewerUrl } from '@pages/embed/helpers/viewerUrl';

const EmbedBrand = ({ params }) => {
    const href = useMemo(() => buildViewerUrl(params), [params]);

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir en MapaLab"
            className="absolute bottom-13 right-3.5 md:bottom-10 md:right-2 z-[4] flex flex-col items-center rounded-[6px] py-1 backdrop-blur-md"
        >
            <img src={mapalabLarge} alt="MapaLab — IIEG" className="hidden md:not-pointer-coarse:block md:w-0 md:min-w-full" />
            <img src={mapalabShort} alt="MapaLab — IIEG" className="block md:not-pointer-coarse:hidden size-8" />
            <span aria-hidden="true" className="hidden md:not-pointer-coarse:block h-0 overflow-hidden px-3 font-[Garet,sans-serif] font-medium text-[12px] tracking-[0px] whitespace-nowrap">
                Contribuciones ©
            </span>
        </a>
    );
};

export default EmbedBrand;
