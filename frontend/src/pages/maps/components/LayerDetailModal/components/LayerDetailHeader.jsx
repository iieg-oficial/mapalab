import { useContext, useMemo } from 'react';
import { useEventos } from '@hooks/useEventos';
import MapsContext from '@contexts/MapsContext';
import { findEventoByLayerId } from '@pages/maps/helpers/eventoHelpers';
import LayerThemeAvatar from './LayerThemeAvatar';

const matchActive = (activeEvento, layerId) => (
    activeEvento?.layerIds?.includes(layerId)
        && (activeEvento.iconoUrl || activeEvento.imagenUrl)
        ? activeEvento : null
);

const LayerDetailHeader = ({ activeEvento, selectedLayerId, themeName }) => {
    const { allLayers } = useContext(MapsContext);
    const { eventos } = useEventos();

    const eventoMatch = useMemo(() => {
        const fromActive = matchActive(activeEvento, selectedLayerId);
        if (fromActive) return fromActive;
        const fromList = findEventoByLayerId(eventos, selectedLayerId, allLayers);
        return fromList && (fromList.iconoUrl || fromList.imagenUrl) ? fromList : null;
    }, [activeEvento, selectedLayerId, eventos, allLayers]);

    const label = eventoMatch?.titulo || themeName;
    const imageUrl = eventoMatch ? (eventoMatch.iconoUrl || eventoMatch.imagenUrl) : null;

    return (
        <div className="flex items-center gap-3">
            <LayerThemeAvatar name={label} imageUrl={imageUrl} size="md" />
            <span className="text-[14px]/[47px] font-garet font-bold text-[#465055] tracking-normal">
                {label}
            </span>
        </div>
    );
};

export default LayerDetailHeader;
