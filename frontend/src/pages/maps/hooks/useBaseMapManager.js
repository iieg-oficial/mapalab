import { useEffect } from 'react';

export const useBaseMapManager = (baseMapRef, basemaps, baseMapId) => {
    useEffect(() => {
        if (baseMapRef.current) {
            const source = basemaps[baseMapId].create();

            if (source === null) {
                baseMapRef.current.setVisible(false);
            } else {
                baseMapRef.current.setVisible(true);
                baseMapRef.current.setSource(source);
                baseMapRef.current.setZIndex(-1);
            }
        }
    }, [baseMapRef, baseMapId, basemaps]);
};
