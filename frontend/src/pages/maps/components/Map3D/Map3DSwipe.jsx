import { useMemo, useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import Map3DView from './Map3DView';

const useRefDelPane = (instancia) => useMemo(() => (instancia ? { current: instancia } : null), [instancia]);

const Map3DSwipe = () => {
    const { paneMapInstances } = useMapsContext();
    const refA = useRefDelPane(paneMapInstances?.[0]);
    const refB = useRefDelPane(paneMapInstances?.[1]);
    const [mapaB, setMapaB] = useState(null);
    const [midiendo, setMidiendo] = useState(false);
    const mapasExtra = useMemo(() => (mapaB ? [mapaB] : []), [mapaB]);
    return (
        <>
            {refA && <Map3DView key="A" olMapRef={refA} principal mapasExtra={mapasExtra} onMidiendo={setMidiendo} />}
            {refB && <Map3DView key="B" olMapRef={refB} principal={false} mediciones={false} onMapa={setMapaB} pausado={midiendo} />}
        </>
    );
};

export default Map3DSwipe;
