import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';

const DetachStatsButton = ({ onDetach }) => (
    <Tooltip content="Ver las estadísticas en un panel junto a capas activas">
        <button
            type="button"
            onClick={onDetach}
            aria-label="Convertir las estadísticas en panel"
            className="cursor-pointer text-gray-500 hover:text-purple focus:outline-none focus-visible:ring-2 focus-visible:ring-purple rounded-full"
        >
            <Icon name="numeralia" className="size-5" />
        </button>
    </Tooltip>
);

export default DetachStatsButton;
