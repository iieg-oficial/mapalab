export const OPCIONES_AGRUPAR = { cluster: true, clusterRadius: 45, clusterMaxZoom: 13 };
export const SIN_GRUPO = ['!', ['has', 'point_count']];
const PREFIJO = 'cuenta:';

export const capaDeGrupos = (sourceId, escala = 1) => ({
    id: `${sourceId}-grupo`,
    type: 'symbol',
    source: sourceId,
    filter: ['has', 'point_count'],
    layout: {
        'icon-image': ['concat', PREFIJO, ['get', 'point_count_abbreviated']],
        'icon-size': escala,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-pitch-alignment': 'viewport',
        'icon-rotation-alignment': 'viewport',
    },
});

export const medidaDeGrupo = (texto) => Math.max(28, 16 + String(texto).length * 7);

const dibujarGrupo = (texto, ratio) => {
    const lado = Math.round(medidaDeGrupo(texto) * ratio);
    const lienzo = document.createElement('canvas');
    lienzo.width = lado;
    lienzo.height = lado;
    const ctx = lienzo.getContext('2d');
    ctx.fillStyle = '#5C2472';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2 * ratio;
    ctx.beginPath();
    ctx.arc(lado / 2, lado / 2, lado / 2 - ratio, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 ${Math.round(12 * ratio)}px Garet, Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, lado / 2, lado / 2 + ratio);
    return { width: lado, height: lado, data: ctx.getImageData(0, 0, lado, lado).data };
};

export const registrarGrupos = (map) => {
    const alFaltar = ({ id }) => {
        if (!String(id).startsWith(PREFIJO) || map.hasImage(id)) return;
        const ratio = window.devicePixelRatio || 1;
        map.addImage(id, dibujarGrupo(id.slice(PREFIJO.length), ratio), { pixelRatio: ratio });
    };
    map.on('styleimagemissing', alFaltar);
    return () => map.off('styleimagemissing', alFaltar);
};
