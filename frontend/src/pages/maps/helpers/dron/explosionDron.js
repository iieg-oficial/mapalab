import * as THREE from 'three';

const PARTICULAS = 120;
const DURACION = 1.8;
const GRAVEDAD = 22;
const COLORES = ['#fff3b0', '#ffb347', '#ff8300', '#e8542a', '#6b6470', '#3a3540'];

export const crearExplosion = () => {
    const grupo = new THREE.Group();
    const posiciones = new Float32Array(PARTICULAS * 3);
    const colores = new Float32Array(PARTICULAS * 3);
    const velocidades = new Float32Array(PARTICULAS * 3);
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
    geometria.setAttribute('color', new THREE.BufferAttribute(colores, 3));
    const chispas = new THREE.Points(geometria, new THREE.PointsMaterial({
        size: 5, vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true,
    }));
    chispas.frustumCulled = false;
    const bola = new THREE.Mesh(
        new THREE.SphereGeometry(1, 24, 16),
        new THREE.MeshBasicMaterial({ color: '#ff8300', transparent: true, depthWrite: false }),
    );
    grupo.add(chispas, bola);
    grupo.visible = false;
    let inicio = null;

    const encender = () => {
        const color = new THREE.Color();
        for (let i = 0; i < PARTICULAS; i += 1) {
            const angulo = Math.random() * Math.PI * 2;
            const subida = Math.random() * 0.9 + 0.1;
            const rapidez = 12 + Math.random() * 38;
            velocidades.set([Math.cos(angulo) * rapidez * (1 - subida * 0.5), Math.sin(angulo) * rapidez * (1 - subida * 0.5), subida * rapidez], i * 3);
            color.set(COLORES[Math.floor(Math.random() * COLORES.length)]);
            colores.set([color.r, color.g, color.b], i * 3);
        }
        geometria.attributes.color.needsUpdate = true;
    };

    const actualizar = (desde) => {
        if (desde === null) {
            grupo.visible = false;
            inicio = null;
            return false;
        }
        if (inicio !== desde) {
            inicio = desde;
            encender();
        }
        const t = (performance.now() - desde) / 1000;
        grupo.visible = t < DURACION;
        if (!grupo.visible) return true;
        for (let i = 0; i < PARTICULAS; i += 1) {
            posiciones[i * 3] = velocidades[i * 3] * t;
            posiciones[i * 3 + 1] = velocidades[i * 3 + 1] * t;
            posiciones[i * 3 + 2] = velocidades[i * 3 + 2] * t - 0.5 * GRAVEDAD * t * t;
        }
        geometria.attributes.position.needsUpdate = true;
        chispas.material.opacity = Math.max(0, 1 - t / DURACION);
        bola.scale.setScalar(4 + t * 38);
        bola.material.opacity = Math.max(0, 0.85 - t * 1.4);
        bola.material.color.set(t < 0.25 ? '#fff3b0' : '#ff8300');
        return true;
    };

    return { grupo, actualizar };
};
