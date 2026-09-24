export const esperarRedibujo3d = (mapas) => Promise.all([...mapas].map(mapa => new Promise((resolve) => {
    mapa.once('idle', resolve);
    mapa.resize();
    mapa.triggerRepaint();
})));
