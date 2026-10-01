const PASO_MS = 200;
const LIMITE_MS = 30000;
const QUIETO_MS = 4000;

export const esperarMapa3d = (map3dRef, limiteMs = LIMITE_MS) => new Promise((resolver, rechazar) => {
    const inicio = performance.now();
    const revisar = () => {
        const map = map3dRef?.current;
        if (map?.loaded?.()) {
            const listo = setTimeout(() => resolver(map), QUIETO_MS);
            map.once('idle', () => {
                clearTimeout(listo);
                resolver(map);
            });
            return;
        }
        if (performance.now() - inicio > limiteMs) {
            rechazar(new Error('La vista 3D no terminó de cargar. Intenta de nuevo.'));
            return;
        }
        setTimeout(revisar, PASO_MS);
    };
    revisar();
});
