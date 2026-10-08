export const ANCHO_INSTRUMENTO = 400;
export const ALTO_INSTRUMENTO = 170;
const FUENTE = 'Garet, Figtree, system-ui, sans-serif';
const MORADO = '#6d2a8a';
const NARANJA = '#ff8300';
const ROSA = '#d6336c';
const TINTA = '#221a2e';
const TINTA_2 = '#6a6180';
const LILA = '#efe6f4';
const GRIS = '#c9bcd6';
const RAD = Math.PI / 180;
const formato = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });

export const tonoAltura = agl => (agl < 20 ? 'peligro' : agl < 45 ? 'aviso' : '');
const COLOR_TONO = { peligro: ROSA, aviso: NARANJA, '': MORADO };

const texto = (ctx, t, x, y, tam, peso = 800, color = TINTA, alinear = 'center') => {
    ctx.font = `${peso} ${tam}px ${FUENTE}`;
    ctx.fillStyle = color;
    ctx.textAlign = alinear;
    ctx.textBaseline = 'middle';
    ctx.fillText(t, x, y);
};

const redondeado = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
};

const candado = (ctx, x, y) => {
    ctx.save();
    ctx.strokeStyle = MORADO;
    ctx.fillStyle = MORADO;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y - 4, 5, Math.PI, 0);
    ctx.stroke();
    redondeado(ctx, x - 7.5, y - 4, 15, 11, 2.5);
    ctx.fill();
    ctx.restore();
};

const cinta = (ctx, { agl, msnm, perfil }) => {
    const y = 140 - (118 * Math.log1p(Math.max(0, agl))) / Math.log1p(perfil.techo ?? 3000);
    const tono = COLOR_TONO[tonoAltura(agl)];
    ctx.fillStyle = LILA;
    redondeado(ctx, 34, 18, 26, 124, 13);
    ctx.fill();
    ctx.fillStyle = '#b9a58a';
    ctx.fillRect(28, 140, 38, 6);
    ctx.strokeStyle = tono;
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(47, y); ctx.lineTo(47, 140); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = tono;
    ctx.beginPath(); ctx.moveTo(47, y - 9); ctx.lineTo(57, y + 6); ctx.lineTo(37, y + 6); ctx.closePath(); ctx.fill();
    texto(ctx, formato.format(agl), 100, 70, 26, 800, tono === MORADO ? TINTA : tono);
    texto(ctx, 'm', 100, 94, 15, 700, TINTA_2);
    texto(ctx, `${formato.format(msnm)} msnm`, 100, 158, 13, 700, TINTA_2);
};

const velocimetro = (ctx, { kmh, perfil, velocidad }) => {
    const [cx, cy, r, a0, a1] = [225, 100, 56, Math.PI * 0.8, Math.PI * 2.2];
    const tope = perfil.vel[2] * 1.05;
    ctx.lineCap = 'round';
    ctx.lineWidth = 12;
    ctx.strokeStyle = LILA;
    ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
    if (perfil.perdida) {
        ctx.strokeStyle = 'rgba(214, 51, 108, 0.35)';
        ctx.beginPath(); ctx.arc(cx, cy, r, a0, a0 + (a1 - a0) * (perfil.perdida / tope)); ctx.stroke();
    }
    ctx.strokeStyle = perfil.perdida && kmh < perfil.perdida ? ROSA : MORADO;
    ctx.beginPath(); ctx.arc(cx, cy, r, a0, a0 + (a1 - a0) * Math.min(1, kmh / tope)); ctx.stroke();
    perfil.vel.forEach((v, i) => {
        const a = a0 + (a1 - a0) * Math.min(1, v / tope);
        ctx.fillStyle = i === velocidad ? NARANJA : GRIS;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * (r + 13), cy + Math.sin(a) * (r + 13), 3.5, 0, Math.PI * 2); ctx.fill();
    });
    texto(ctx, formato.format(kmh), cx, cy - 4, 26);
    texto(ctx, 'km/h', cx, cy + 20, 13, 700, TINTA_2);
};

const horizonte = (ctx, kx, ky, { alabeo, cabeceo }) => {
    ctx.save();
    ctx.beginPath(); ctx.arc(kx, ky, 38, 0, Math.PI * 2); ctx.clip();
    ctx.translate(kx, ky);
    ctx.rotate(-alabeo);
    const d = Math.max(-30, Math.min(30, cabeceo * 120));
    ctx.fillStyle = '#bcd8ee'; ctx.fillRect(-60, -60, 120, 60 + d);
    ctx.fillStyle = '#c9b48f'; ctx.fillRect(-60, d, 120, 60);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-60, d); ctx.lineTo(60, d); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = NARANJA; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(kx - 24, ky); ctx.lineTo(kx - 8, ky); ctx.lineTo(kx, ky + 7); ctx.lineTo(kx + 8, ky); ctx.lineTo(kx + 24, ky); ctx.stroke();
    ctx.strokeStyle = GRIS; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(kx, ky, 38, 0, Math.PI * 2); ctx.stroke();
    texto(ctx, `${formato.format(Math.abs(alabeo / RAD))}°`, kx, 142, 20);
};

const variometro = (ctx, kx, ky, { vsReal, perfil }) => {
    ctx.strokeStyle = GRIS; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(kx, ky, 38, 0, Math.PI * 2); ctx.stroke();
    for (let k = -4; k <= 4; k += 1) {
        const a = Math.PI + k * 0.33;
        ctx.beginPath(); ctx.moveTo(kx + Math.cos(a) * 32, ky + Math.sin(a) * 32); ctx.lineTo(kx + Math.cos(a) * 38, ky + Math.sin(a) * 38); ctx.stroke();
    }
    const a = Math.PI - Math.max(-4, Math.min(4, vsReal)) * 0.33;
    ctx.strokeStyle = vsReal >= 0 ? '#1f9d55' : ROSA; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx + Math.cos(a) * 32, ky + Math.sin(a) * 32); ctx.stroke();
    ctx.fillStyle = MORADO; ctx.beginPath(); ctx.arc(kx, ky, 5, 0, Math.PI * 2); ctx.fill();
    if (perfil.viento) {
        ctx.save();
        ctx.translate(kx + 18, ky - 18);
        ctx.rotate(Math.atan2(-perfil.viento[1], perfil.viento[0]));
        ctx.strokeStyle = '#1f6fa8'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.moveTo(4, -4); ctx.lineTo(9, 0); ctx.lineTo(4, 4); ctx.stroke();
        ctx.restore();
    }
    texto(ctx, `${vsReal >= 0 ? '+' : ''}${vsReal.toFixed(1)} m/s`, kx, 142, 18);
};

const camara = (ctx, kx, ky, { camaraGrados }) => {
    ctx.strokeStyle = GRIS; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(kx - 38, ky); ctx.lineTo(kx + 38, ky); ctx.stroke();
    ctx.beginPath(); ctx.arc(kx, ky, 38, 0, Math.PI * 2); ctx.stroke();
    ctx.save();
    ctx.translate(kx, ky);
    ctx.rotate(-camaraGrados * RAD);
    ctx.fillStyle = 'rgba(255, 131, 0, 0.22)';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 36, -0.35, 0.35); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = NARANJA; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(36, 0); ctx.stroke();
    ctx.fillStyle = MORADO; ctx.fillRect(-9, -7, 16, 14);
    ctx.restore();
    texto(ctx, `${formato.format(camaraGrados)}°`, kx, 142, 20);
};

const TERCERO = { horizonte, vario: variometro, camara };

export const dibujarInstrumentos = (ctx, datos) => {
    ctx.clearRect(0, 0, ANCHO_INSTRUMENTO, ALTO_INSTRUMENTO);
    cinta(ctx, datos);
    if (datos.seguir) candado(ctx, 47, 9);
    velocimetro(ctx, datos);
    TERCERO[datos.perfil.instr](ctx, 345, 82, datos);
};

export const dibujarPerfil = (ctx, { muestras, msnm, agl, kmh, velocidad, camaraGrados }) => {
    ctx.clearRect(0, 0, ANCHO_INSTRUMENTO, ALTO_INSTRUMENTO);
    if (!muestras?.length) return;
    const alturas = muestras.map(m => m.h);
    const minH = Math.min(...alturas, msnm) - 40;
    const maxH = Math.max(...alturas, msnm) + 60;
    const [d0, d1] = [muestras[0].d, muestras[muestras.length - 1].d];
    const X = d => 12 + ((d - d0) / (d1 - d0)) * 376;
    const Y = h => 150 - ((h - minH) / (maxH - minH)) * 128;
    const relleno = ctx.createLinearGradient(0, 20, 0, 150);
    relleno.addColorStop(0, '#b8c08a');
    relleno.addColorStop(1, '#e9e3d2');
    ctx.fillStyle = relleno;
    ctx.beginPath(); ctx.moveTo(X(d0), 158);
    muestras.forEach(m => ctx.lineTo(X(m.d), Y(m.h)));
    ctx.lineTo(X(d1), 158); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#8e9f68'; ctx.lineWidth = 2;
    ctx.beginPath();
    muestras.forEach((m, i) => (i ? ctx.lineTo(X(m.d), Y(m.h)) : ctx.moveTo(X(m.d), Y(m.h))));
    ctx.stroke();
    ctx.strokeStyle = ROSA; ctx.lineWidth = 4; ctx.lineCap = 'round';
    muestras.forEach((m, i) => {
        if (i === 0 || m.d <= 0 || m.h < msnm - 10) return;
        ctx.beginPath(); ctx.moveTo(X(muestras[i - 1].d), Y(muestras[i - 1].h)); ctx.lineTo(X(m.d), Y(m.h)); ctx.stroke();
    });
    const [dx, dy, gy] = [X(0), Y(msnm), Y(msnm - agl)];
    ctx.strokeStyle = TINTA; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx, gy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(-camaraGrados * RAD);
    ctx.fillStyle = 'rgba(255, 131, 0, 0.18)';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 90, -0.3, 0.3); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = MORADO;
    ctx.beginPath(); ctx.ellipse(dx, dy, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(dx - 15, dy - 7, 8, 2.5);
    ctx.fillRect(dx + 7, dy - 7, 8, 2.5);
    const etiqueta = `${formato.format(agl)} m`;
    ctx.font = `800 17px ${FUENTE}`;
    const w = ctx.measureText(etiqueta).width + 14;
    const ey = (dy + gy) / 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    redondeado(ctx, dx + 8, ey - 12, w, 24, 12);
    ctx.fill();
    texto(ctx, etiqueta, dx + 8 + w / 2, ey, 17);
    for (let i = 0; i < 3; i += 1) {
        ctx.strokeStyle = i <= velocidad ? NARANJA : '#d9d0e2'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const x0 = 300 + i * 14;
        ctx.beginPath(); ctx.moveTo(x0, 16); ctx.lineTo(x0 + 8, 24); ctx.lineTo(x0, 32); ctx.stroke();
    }
    texto(ctx, `${formato.format(kmh)} km/h`, 388, 48, 15, 800, TINTA, 'right');
    texto(ctx, `${formato.format(msnm)} msnm`, 14, 20, 13, 700, TINTA_2, 'left');
};

export const ZONAS_INSTRUMENTO = { altimetro: [0, 130], velocimetro: [130, 280] };

export const zonaDelInstrumento = (x) => {
    const encontrada = Object.entries(ZONAS_INSTRUMENTO).find(([, [desde, hasta]]) => x >= desde && x < hasta);
    return encontrada ? encontrada[0] : null;
};
