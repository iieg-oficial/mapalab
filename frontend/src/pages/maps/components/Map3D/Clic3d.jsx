import { useFeatureInfo } from '@hooksMaps/useFeatureInfo';
import { useMap3dClick } from '@hooksMaps/useMap3dClick';

export const Clic3dVisor = ({ map, mapRef, pausado }) => {
    const { queryFeatures } = useFeatureInfo();
    useMap3dClick(map, mapRef, pausado, queryFeatures);
    return null;
};

export const Clic3dPropio = ({ map, mapRef, pausado, consultar }) => {
    useMap3dClick(map, mapRef, pausado, consultar);
    return null;
};
