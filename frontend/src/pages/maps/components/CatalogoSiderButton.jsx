import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import { useGoToCatalogo } from '@pages/catalogo/useGoToCatalogo';
import { useIsNonProd } from '@hooks/useDevTools';

const CatalogoSiderButton = ({ tooltipPlacement = 'right' }) => {
    const goToCatalogo = useGoToCatalogo();
    const isNonProd = useIsNonProd();
    if (!isNonProd) return null;

    const handleClick = (e) => {
        e.stopPropagation();
        goToCatalogo();
    };

    return (
        <Tooltip content="Catálogo: explora y descarga capas sueltas" placement={tooltipPlacement} delay={0}>
            <button
                type="button"
                onClick={handleClick}
                aria-label="Ir al catálogo de capas"
                className="size-5 rounded-full bg-white flex items-center justify-center shadow-[0_5px_20px_#1A26641A] cursor-pointer"
            >
                <Icon name="capa_activa" className="size-5" />
            </button>
        </Tooltip>
    );
};

export default CatalogoSiderButton;
