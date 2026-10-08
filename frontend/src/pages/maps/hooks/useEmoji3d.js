import { useEffect } from 'react';

export const anotacionDeEmoji = (simbolo, lngLat) => ({
    type: 'Emoji',
    visible: true,
    geometry: { type: 'Point', coordinates: lngLat },
    symbol: simbolo,
    textLabel: simbolo.kind === 'emoji' ? simbolo.value : (simbolo.name || ''),
});

export const useEmoji3d = (mapas, simbolo, onColocar) => {
    useEffect(() => {
        if (!simbolo || !mapas.length) return undefined;
        const limpiezas = mapas.map((mapa) => {
            const alClic = (event) => onColocar(anotacionDeEmoji(simbolo, event.lngLat.toArray()));
            mapa.on('click', alClic);
            mapa.getCanvas().style.cursor = 'crosshair';
            return () => {
                mapa.off('click', alClic);
                mapa.getCanvas().style.cursor = '';
            };
        });
        return () => limpiezas.forEach(limpiar => limpiar());
    }, [mapas, simbolo, onColocar]);
};
