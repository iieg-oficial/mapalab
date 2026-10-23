// Cámara virtual: cada evento {t, zoom, x, y, dur} arranca una transición desde donde
// esté la cámara en ese instante, aunque la anterior no haya terminado.
const suave = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
const lerp = (a, b, k) => a + (b - a) * k;

const enTramo = ({ desde, hacia, t0, dur }, t) => {
    const k = suave(Math.min(1, Math.max(0, (t - t0) / dur)));
    return { zoom: lerp(desde.zoom, hacia.zoom, k), x: lerp(desde.x, hacia.x, k), y: lerp(desde.y, hacia.y, k) };
};

export const estadoCamara = (eventos, t, { ancho, alto }) => {
    const reposo = { zoom: 1, x: ancho / 2, y: alto / 2 };
    let tramo = null;
    for (const e of eventos) {
        if (e.t > t) break;
        const desde = tramo ? enTramo(tramo, e.t) : reposo;
        tramo = { desde, hacia: e, t0: e.t, dur: e.dur };
    }
    return tramo ? enTramo(tramo, t) : reposo;
};

// Centra (x, y) en pantalla sin dejar ver fuera del cuadro capturado.
export const transformar = ({ zoom, x, y }, { ancho, alto }) => {
    const limitar = (v, min) => Math.min(0, Math.max(min, v));
    const tx = limitar(ancho / 2 - x * zoom, ancho - ancho * zoom);
    const ty = limitar(alto / 2 - y * zoom, alto - alto * zoom);
    return `translate(${tx}px, ${ty}px) scale(${zoom})`;
};
