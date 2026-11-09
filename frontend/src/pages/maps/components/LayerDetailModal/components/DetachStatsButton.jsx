import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import Badge from '@components/Badge';
import { useIsLiberada, useIsNonProd } from '@hooks/useDevTools';

const DetachStatsButton = ({ onDetach, iconClassName = 'size-5' }) => {
    const isNonProd = useIsNonProd();
    const conEstadisticas = useIsLiberada('estadisticas');
    if (!conEstadisticas) return null;
    return (
        <Tooltip content="Ver las estadísticas en un panel junto a capas activas">
            <button
                type="button"
                onClick={onDetach}
                aria-label="Convertir las estadísticas en panel"
                className="relative cursor-pointer text-gray-500 hover:text-purple focus:outline-none focus-visible:ring-2 focus-visible:ring-purple rounded-full"
            >
                <Icon name="desacoplar" className={iconClassName} />
                {isNonProd && <Badge variant="pill" color="orange" text="BETA" className="absolute -top-2 -right-3 text-[8px] px-1.5 pointer-events-none" />}
            </button>
        </Tooltip>
    );
};

export default DetachStatsButton;
