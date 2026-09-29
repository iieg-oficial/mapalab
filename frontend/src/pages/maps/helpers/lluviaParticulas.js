import * as THREE from 'three';

const GOTAS_MAXIMAS = 9000;
const CIRCUNFERENCIA_M = 40075016.686;
const CAIDA = 0.9;
const VIENTO = 0.12;
const LARGO = 0.012;

export const volumenDeLluvia = (map) => {
    const centro = map.getCenter();
    const metrosPorPixel = (CIRCUNFERENCIA_M * Math.cos((centro.lat * Math.PI) / 180)) / (512 * 2 ** map.getZoom());
    const ancho = metrosPorPixel * map.getCanvas().clientWidth * 1.6;
    return { centro, suelo: map.queryTerrainElevation(centro) ?? 0, ancho, alto: ancho * 0.55 };
};

export const crearLluvia = () => {
    const posiciones = new Float32Array(GOTAS_MAXIMAS * 6);
    const semillas = new Float32Array(GOTAS_MAXIMAS * 3);
    for (let i = 0; i < GOTAS_MAXIMAS; i += 1) {
        semillas.set([Math.random() - 0.5, Math.random() - 0.5, Math.random()], i * 3);
    }
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
    const trazos = new THREE.LineSegments(geometria, new THREE.LineBasicMaterial({
        color: '#6f9cc6', transparent: true, opacity: 0.6, depthWrite: false,
    }));
    trazos.frustumCulled = false;
    let fase = 0;
    let anterior = performance.now();

    const actualizar = ({ activa, densidad, ancho, alto }) => {
        trazos.visible = activa;
        if (!activa) return;
        const ahora = performance.now();
        fase = (fase + ((ahora - anterior) / 1000) * CAIDA) % 1;
        anterior = ahora;
        const cuantas = Math.round(GOTAS_MAXIMAS * densidad);
        const largo = alto * LARGO;
        for (let i = 0; i < cuantas; i += 1) {
            const [sx, sy, sz] = [semillas[i * 3], semillas[i * 3 + 1], semillas[i * 3 + 2]];
            const altura = (((sz - fase) % 1) + 1) % 1;
            const x = sx * ancho + (1 - altura) * VIENTO * ancho * 0.1;
            const y = sy * ancho;
            const z = altura * alto;
            posiciones.set([x, y, z, x - largo * VIENTO, y, z + largo], i * 6);
        }
        geometria.setDrawRange(0, cuantas * 2);
        geometria.attributes.position.needsUpdate = true;
        trazos.material.opacity = 0.45 + densidad * 0.4;
    };

    return { objeto: trazos, actualizar, liberar: () => { geometria.dispose(); trazos.material.dispose(); } };
};
