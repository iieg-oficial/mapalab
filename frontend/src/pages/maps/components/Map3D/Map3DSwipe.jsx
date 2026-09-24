import { useMemo } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import Map3DView from './Map3DView';

const PANES = [0, 1];

const Map3DSwipe = () => {
    const { paneMapInstances } = useMapsContext();
    const refs = useMemo(
        () => PANES.map(i => (paneMapInstances?.[i] ? { current: paneMapInstances[i] } : null)),
        [paneMapInstances],
    );
    return refs.map((ref, i) => ref && <Map3DView key={i} olMapRef={ref} principal={i === 0} mediciones={false} />);
};

export default Map3DSwipe;
