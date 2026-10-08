export const ESTILOS_PUNTOS_3D = ['frente', 'poste', 'sombra'];
export const ESTILO_PUNTOS_3D_DEFAULT = 'sombra';

const POSTE = 22;
const PUNTO_BASE = 3;
const SOMBRA_ALTO = 6;
const COLOR_POSTE = '#465055';

export const medidasDeIcono = (ancho, alto, estilo, ratio = 1) => {
    if (estilo === 'poste') return { ancho: Math.max(ancho, PUNTO_BASE * 2 * ratio), alto: alto + (POSTE + PUNTO_BASE) * ratio };
    if (estilo === 'sombra') return { ancho, alto: alto + SOMBRA_ALTO * ratio };
    return { ancho, alto };
};

export const dibujarIcono = (ctx, imagen, ancho, alto, estilo, ratio = 1) => {
    const lienzo = medidasDeIcono(ancho, alto, estilo, ratio);
    const x = (lienzo.ancho - ancho) / 2;
    if (estilo === 'poste') {
        const centro = lienzo.ancho / 2;
        ctx.strokeStyle = COLOR_POSTE;
        ctx.lineWidth = 2 * ratio;
        ctx.beginPath();
        ctx.moveTo(centro, alto - ratio);
        ctx.lineTo(centro, lienzo.alto - PUNTO_BASE * ratio);
        ctx.stroke();
        ctx.fillStyle = COLOR_POSTE;
        ctx.beginPath();
        ctx.arc(centro, lienzo.alto - PUNTO_BASE * ratio, PUNTO_BASE * ratio, 0, Math.PI * 2);
        ctx.fill();
    }
    if (estilo === 'sombra') {
        ctx.fillStyle = 'rgba(26, 38, 100, 0.22)';
        ctx.beginPath();
        ctx.ellipse(lienzo.ancho / 2, lienzo.alto - (SOMBRA_ALTO / 2) * ratio, ancho * 0.36, (SOMBRA_ALTO / 2) * ratio, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.drawImage(imagen, x, 0, ancho, alto);
    return lienzo;
};

export const tamanoPorEstilo = (estilo, escala = 1) => (estilo === 'sombra'
    ? ['interpolate', ['linear'], ['zoom'], 6, Number((0.9 * escala).toFixed(3)), 13, Number((1.5 * escala).toFixed(3))]
    : escala);
