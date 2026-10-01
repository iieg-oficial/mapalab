const MORADO = '#5C2472';
const NARANJA = '#FF8300';
const TINTA = '#221A2E';
const SUAVE = '#4A4255';
const PISTA = 'rgba(255, 255, 255, 0.75)';
const FUENTE = 'Garet, Figtree, system-ui, sans-serif';
const INICIO = Math.PI * 0.75;
const ARCO = Math.PI * 1.5;

const acotar = valor => Math.max(0, Math.min(1, valor));

const textos = (ctx, cx, cy, r, valor, unidad, etiqueta) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = TINTA;
    ctx.font = `800 ${Math.round(r * 0.42 * Math.min(1, 4 / Math.max(4, String(valor).length)))}px ${FUENTE}`;
    ctx.fillText(valor, cx, cy + r * 0.62);
    ctx.fillStyle = SUAVE;
    ctx.font = `600 ${Math.round(r * 0.26)}px ${FUENTE}`;
    ctx.fillText(unidad, cx, cy + r * 0.95);
    ctx.fillText(etiqueta, cx, cy - r * 1.14);
};

export const dibujarDial = (ctx, { cx, cy, r, fraccion, valor, unidad, etiqueta }) => {
    const f = acotar(fraccion);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = r * 0.16;
    ctx.strokeStyle = PISTA;
    ctx.beginPath();
    ctx.arc(cx, cy, r, INICIO, INICIO + ARCO);
    ctx.stroke();
    ctx.strokeStyle = NARANJA;
    ctx.beginPath();
    ctx.arc(cx, cy, r, INICIO, INICIO + ARCO * Math.max(0.02, f));
    ctx.stroke();
    const angulo = INICIO + ARCO * f;
    ctx.strokeStyle = MORADO;
    ctx.lineWidth = Math.max(1.5, r * 0.07);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angulo) * r * 0.72, cy + Math.sin(angulo) * r * 0.72);
    ctx.stroke();
    ctx.fillStyle = MORADO;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    textos(ctx, cx, cy, r, valor, unidad, etiqueta);
    ctx.restore();
};

export const dibujarBrujula = (ctx, { cx, cy, r, rumbo, etiqueta }) => {
    ctx.save();
    ctx.lineWidth = r * 0.1;
    ctx.strokeStyle = PISTA;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.translate(cx, cy);
    ctx.rotate((-rumbo * Math.PI) / 180);
    ctx.fillStyle = NARANJA;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.8);
    ctx.lineTo(r * 0.25, 0);
    ctx.lineTo(-r * 0.25, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = MORADO;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.8);
    ctx.lineTo(r * 0.25, 0);
    ctx.lineTo(-r * 0.25, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    const grados = ((Math.round(rumbo) % 360) + 360) % 360;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = SUAVE;
    ctx.font = `600 ${Math.round(r * 0.26)}px ${FUENTE}`;
    ctx.fillText(etiqueta, cx, cy - r * 1.14);
    ctx.fillStyle = TINTA;
    ctx.font = `800 ${Math.round(r * 0.36)}px ${FUENTE}`;
    ctx.fillText(`${String(grados).padStart(3, '0')}°`, cx, cy + r * 1.45);
    ctx.restore();
};

export const dibujarIndicadores = (ctx, { x, y, ancho, alto, lista }) => {
    const r = Math.min(alto * 0.27, ancho / 10);
    const cy = y + alto * 0.5;
    lista.slice(0, 3).forEach((indicador, i) => {
        const cx = x + (ancho * (2 * i + 1)) / 6;
        if (indicador.tipo === 'brujula') dibujarBrujula(ctx, { cx, cy, r, ...indicador });
        else dibujarDial(ctx, { cx, cy, r, ...indicador });
    });
};
