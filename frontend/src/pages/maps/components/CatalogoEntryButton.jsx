import Tooltip from '@components/Tooltip';
import Badge from '@components/Badge';
import { useGoToCatalogo } from '@pages/catalogo/useGoToCatalogo';
import IconoHerramienta from './IconoHerramienta';

const CatalogoEntryButton = () => {
    const goToCatalogo = useGoToCatalogo();

    return (
        <Tooltip content="Catálogo: explora y descarga capas sueltas del IIEG" placement="top" delay={300}>
            <button
                type="button"
                onClick={goToCatalogo}
                aria-label="Ir al catálogo de capas"
                className="relative flex items-center justify-center size-7 rounded-full md:size-auto md:justify-start md:gap-1.5 md:rounded-[20px] md:px-3 md:py-1 bg-white shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)] font-[Garet,sans-serif] font-medium text-[12px] leading-4 text-[#6E7477] hover:bg-purple-soft transition-colors cursor-pointer"
            >
                <IconoHerramienta id="catalogo" className="size-5" />
                <span className="hidden md:inline">Catálogo</span>
                <Badge variant="pill" color="orange" text="BETA" className="absolute -top-2 -right-1 md:-right-3 z-10 text-[7px] md:text-[8px] px-1.5 max-md:px-1! pointer-events-none" />
            </button>
        </Tooltip>
    );
};

export default CatalogoEntryButton;
