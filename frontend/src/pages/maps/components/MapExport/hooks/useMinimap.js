import { useContext } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import MapsContext from '@contexts/MapsContext';
import { getMinimapImage } from '../utils/minimapImages';

export const useMinimap = () => {
    const { mapRef } = useMapsContext();
    const { baseMapId } = useContext(MapsContext);

    const generateMinimapImage = (viewType = 'viewport') => {
        const zoom = mapRef.current?.getView().getZoom() ?? 8;
        return getMinimapImage(baseMapId, viewType, zoom);
    };

    return {
        generateMinimapImage
    };
};
