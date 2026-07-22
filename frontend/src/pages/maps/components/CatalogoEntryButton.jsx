import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import Badge from '@components/Badge';
import { useGoToCatalogo } from '@pages/catalogo/useGoToCatalogo';

const IS_NON_PROD = ['dev', 'beta'].includes(import.meta.env.VITE_APP_ENV);

const CatalogoEntryButton = () => {
    const goToCatalogo = useGoToCatalogo();
    if (!IS_NON_PROD) return null;

    return (
        <Tooltip content="Catálogo: explora y descarga capas sueltas del IIEG" placement="top" delay={300}>
            <button
                type="button"
                onClick={goToCatalogo}
                aria-label="Ir al catálogo de capas"
                className="relative flex items-center justify-center size-7 rounded-full md:size-auto md:justify-start md:gap-1.5 md:rounded-[20px] md:px-3 md:py-1 bg-white shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)] font-[Garet,sans-serif] font-medium text-[12px] leading-4 text-purple hover:bg-purple-soft transition-colors cursor-pointer"
            >
                <Icon name="capa_activa" className="size-4" />
                <span className="hidden md:inline">Catálogo</span>
                <Badge variant="pill" color="orange" text="BETA" className="absolute -top-1 -right-2 text-[8px] px-1.5" />
            </button>
        </Tooltip>
    );
};

export default CatalogoEntryButton;
