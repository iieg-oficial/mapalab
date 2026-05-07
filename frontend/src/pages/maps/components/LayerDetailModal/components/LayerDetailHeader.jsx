import { useMemo } from 'react';
import { useEventoContext } from '@hooks/useEvento';
import LayerThemeAvatar from './LayerThemeAvatar';

const matchActive = (activeEvento, layerId) => (
    activeEvento?.layerIds?.includes(layerId)
        && (activeEvento.iconoUrl || activeEvento.imagenUrl)
        ? activeEvento : null
);

const LayerDetailHeader = ({ activeEvento, selectedLayerId, themeName }) => {
    const { findEventoByLayerId } = useEventoContext();

    const eventoMatch = useMemo(() => {
        const fromActive = matchActive(activeEvento, selectedLayerId);
        if (fromActive) return fromActive;
        const fromList = findEventoByLayerId(selectedLayerId);
        return fromList && (fromList.iconoUrl || fromList.imagenUrl) ? fromList : null;
    }, [activeEvento, selectedLayerId, findEventoByLayerId]);

    const label = eventoMatch?.titulo || themeName;
    const imageUrl = eventoMatch ? (eventoMatch.iconoUrl || eventoMatch.imagenUrl) : null;

    return (
        <div className="flex items-center gap-3">
            <LayerThemeAvatar name={label} imageUrl={imageUrl} size="md" />
            <span className="text-[14px]/[47px] font-garet font-bold text-graphite tracking-normal">
                {label}
            </span>
        </div>
    );
};

export default LayerDetailHeader;
