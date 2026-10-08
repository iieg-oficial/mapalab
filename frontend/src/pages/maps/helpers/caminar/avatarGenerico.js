import * as THREE from 'three';

const PIEL = '#C68E6A';
const CAMISA = '#5C2472';
const PANTALON = '#2E3A59';
const ZAPATO = '#1E1E24';

const material = color => new THREE.MeshLambertMaterial({ color });

const extremidad = (radio, largo, color) => {
    const pivote = new THREE.Group();
    const g = new THREE.CapsuleGeometry(radio, largo - radio * 2, 4, 8);
    g.rotateX(Math.PI / 2);
    g.translate(0, 0, -largo / 2);
    pivote.add(new THREE.Mesh(g, material(color)));
    return pivote;
};

export const crearAvatarGenerico = () => {
    const grupo = new THREE.Group();
    const torso = new THREE.Mesh((() => {
        const g = new THREE.CapsuleGeometry(0.17, 0.42, 4, 10);
        g.rotateX(Math.PI / 2);
        g.translate(0, 0, 1.18);
        return g;
    })(), material(CAMISA));
    const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), material(PIEL));
    cabeza.position.set(0, 0, 1.6);
    const piernaIzq = extremidad(0.075, 0.86, PANTALON);
    const piernaDer = extremidad(0.075, 0.86, PANTALON);
    piernaIzq.position.set(-0.09, 0, 0.9);
    piernaDer.position.set(0.09, 0, 0.9);
    const brazoIzq = extremidad(0.055, 0.62, CAMISA);
    const brazoDer = extremidad(0.055, 0.62, CAMISA);
    brazoIzq.position.set(-0.24, 0, 1.42);
    brazoDer.position.set(0.24, 0, 1.42);
    [piernaIzq, piernaDer].forEach((p) => {
        const zapato = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.07), material(ZAPATO));
        zapato.position.set(0, 0.05, -0.86);
        p.add(zapato);
    });
    grupo.add(torso, cabeza, piernaIzq, piernaDer, brazoIzq, brazoDer);
    const animar = (paso, moviendo) => {
        const fase = paso * 3.2;
        const amplitud = moviendo ? 0.55 : 0;
        piernaIzq.rotation.x = Math.sin(fase) * amplitud;
        piernaDer.rotation.x = -Math.sin(fase) * amplitud;
        brazoIzq.rotation.x = -Math.sin(fase) * amplitud * 0.7;
        brazoDer.rotation.x = Math.sin(fase) * amplitud * 0.7;
    };
    return { grupo, animar };
};
