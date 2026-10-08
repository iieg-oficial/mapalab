import { useEffect } from 'react';

const camaraDe = (map) => ({ center: map.getCenter(), zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() });

export const sincronizar = (grupo, origen) => {
    if (grupo.fuente && grupo.fuente !== origen) return;
    grupo.fuente = origen;
    const camara = camaraDe(origen);
    grupo.miembros.forEach((otro) => { if (otro !== origen) otro.jumpTo(camara); });
    grupo.fuente = null;
};

export const useCamara3dSincronizada = (map, grupoRef) => {
    useEffect(() => {
        const grupo = grupoRef?.current;
        if (!map || !grupo) return undefined;
        const [referencia] = grupo.miembros;
        if (referencia) map.jumpTo(camaraDe(referencia));
        grupo.miembros.add(map);
        const alMover = () => sincronizar(grupo, map);
        map.on('move', alMover);
        return () => {
            map.off('move', alMover);
            grupo.miembros.delete(map);
        };
    }, [map, grupoRef]);
};
