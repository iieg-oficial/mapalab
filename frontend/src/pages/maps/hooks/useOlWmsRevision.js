import { useEffect, useState } from 'react';
import { unByKey } from 'ol/Observable';

export const useOlWmsRevision = (map, olMapRef) => {
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        const olMap = olMapRef.current;
        if (!map || !olMap) return undefined;
        let keys = [];
        const bump = () => setRevision(value => value + 1);
        const watch = () => {
            unByKey(keys);
            keys = olMap.getLayers().getArray()
                .filter(layer => layer.get('mergedLayers'))
                .map(layer => layer.getSource().on('change', bump));
        };
        const collectionKeys = olMap.getLayers().on(['add', 'remove'], () => { watch(); bump(); });
        watch();
        return () => { unByKey(keys); unByKey(collectionKeys); };
    }, [map, olMapRef]);

    return revision;
};
