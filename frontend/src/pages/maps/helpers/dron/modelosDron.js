import * as THREE from 'three';

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.15, ...extra });
const GRAFITO = () => mat('#2b2735', { roughness: 0.65 });
const CLARO = () => mat('#ece8f2');

const malla = (geo, material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    return m;
};

const led = (color, x, y, z) => {
    const m = malla(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color }), x, y, z);
    m.userData.led = true;
    return m;
};

const crearKit = () => {
    const grafito = GRAFITO();
    const claro = CLARO();
    const disco = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.2 });
    const lente = mat('#ff8300', { emissive: '#5a2a00' });
    const rotorHorizontal = (g, helices, x, y, z, radio, sentido) => {
        g.add(malla(new THREE.CylinderGeometry(radio, radio, 0.03, 28), disco, x, y, z));
        const aspa = malla(new THREE.BoxGeometry(radio * 1.9, 0.03, 0.15), claro, x, y, z);
        g.add(aspa);
        helices.push({ obj: aspa, eje: 'y', vel: 38 * sentido });
    };
    const rotorEmpuje = (g, helices, x, y, z, radio) => {
        const d = malla(new THREE.CylinderGeometry(radio, radio, 0.03, 28), disco, x, y, z);
        d.rotation.x = Math.PI / 2;
        g.add(d);
        const aspa = malla(new THREE.BoxGeometry(radio * 1.9, 0.15, 0.03), claro, x, y, z);
        g.add(aspa);
        helices.push({ obj: aspa, eje: 'z', vel: 45 });
    };
    const gimbal = (g, y, z) => {
        g.add(malla(new THREE.SphereGeometry(0.28, 16, 12), grafito, 0, y, z));
        const l = malla(new THREE.CircleGeometry(0.13, 16), lente, 0, y, z - 0.27);
        l.rotation.y = Math.PI;
        g.add(l);
    };
    return { grafito, claro, lente, rotorHorizontal, rotorEmpuje, gimbal };
};

const ESQUINAS = [[1, 1], [-1, 1], [1, -1], [-1, -1]];

const CONSTRUCTORES = {
    cuadri(g, h, p, k) {
        g.add(malla(new THREE.BoxGeometry(1.5, 0.45, 2.1), p));
        const tapa = malla(new THREE.SphereGeometry(0.62, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), p, 0, 0.2, 0);
        tapa.scale.set(1, 0.55, 1.3);
        g.add(tapa);
        k.gimbal(g, -0.35, -0.9);
        ESQUINAS.forEach(([sx, sz], i) => {
            const brazo = malla(new THREE.BoxGeometry(0.22, 0.16, 2.2), k.grafito, sx * 0.95, 0.05, sz * 0.95);
            brazo.rotation.y = Math.atan2(sx, sz);
            g.add(brazo);
            g.add(malla(new THREE.CylinderGeometry(0.24, 0.28, 0.4, 16), k.grafito, sx * 1.75, 0.2, sz * 1.75));
            k.rotorHorizontal(g, h, sx * 1.75, 0.44, sz * 1.75, 1.05, i % 3 === 0 ? 1 : -1);
            g.add(led(sz < 0 ? '#ffffff' : (sx > 0 ? '#28d17c' : '#ff3b5c'), sx * 1.75, -0.05, sz * 1.75));
        });
    },
    hexa(g, h, p, k) {
        g.add(malla(new THREE.CylinderGeometry(1, 1, 0.45, 6), p));
        g.add(malla(new THREE.CylinderGeometry(0.6, 0.9, 0.3, 6), k.claro, 0, 0.35, 0));
        k.gimbal(g, -0.45, -0.5);
        for (let i = 0; i < 6; i += 1) {
            const a = i * Math.PI / 3 + Math.PI / 6;
            const [x, z] = [Math.sin(a) * 2.3, Math.cos(a) * 2.3];
            const brazo = malla(new THREE.BoxGeometry(0.18, 0.14, 2.3), k.grafito, x / 2, 0, z / 2);
            brazo.rotation.y = a;
            g.add(brazo);
            g.add(malla(new THREE.CylinderGeometry(0.2, 0.24, 0.35, 14), k.grafito, x, 0.15, z));
            k.rotorHorizontal(g, h, x, 0.36, z, 0.95, i % 2 ? 1 : -1);
            g.add(led(z < -0.5 ? '#ffffff' : (x > 0 ? '#28d17c' : '#ff3b5c'), x, -0.08, z));
        }
        [-0.7, 0.7].forEach(x => g.add(malla(new THREE.BoxGeometry(0.08, 0.08, 2.2), k.grafito, x, -0.8, 0)));
    },
    ala(g, h, p, k) {
        const forma = new THREE.Shape();
        forma.moveTo(0, -1.4); forma.lineTo(3.4, 0.9); forma.lineTo(3.2, 1.3); forma.lineTo(0, 0.7);
        forma.lineTo(-3.2, 1.3); forma.lineTo(-3.4, 0.9); forma.closePath();
        const ala = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: 0.14, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 }), p);
        ala.rotation.x = Math.PI / 2;
        g.add(ala);
        const fuselaje = malla(new THREE.SphereGeometry(0.5, 20, 14), k.claro, 0, 0.1, -0.2);
        fuselaje.scale.set(1, 0.6, 2.4);
        g.add(fuselaje);
        [-2.9, 2.9].forEach(x => g.add(malla(new THREE.BoxGeometry(0.06, 0.55, 0.6), k.grafito, x, 0.3, 1)));
        k.gimbal(g, -0.25, -0.6);
        k.rotorEmpuje(g, h, 0, 0.1, 1.05, 0.7);
        g.add(led('#28d17c', 3.3, 0.1, 1));
        g.add(led('#ff3b5c', -3.3, 0.1, 1));
    },
    vtol(g, h, p, k) {
        const cuerpo = malla(new THREE.CylinderGeometry(0.4, 0.3, 3.4, 16), p);
        cuerpo.rotation.x = Math.PI / 2;
        g.add(cuerpo);
        g.add(malla(new THREE.BoxGeometry(6.4, 0.1, 0.9), k.claro, 0, 0.1, -0.1));
        g.add(malla(new THREE.BoxGeometry(2, 0.08, 0.5), k.claro, 0, 0.2, 1.6));
        g.add(malla(new THREE.BoxGeometry(0.08, 0.6, 0.5), p, 0, 0.45, 1.6));
        [-1.6, 1.6].forEach((x, i) => {
            g.add(malla(new THREE.BoxGeometry(0.12, 0.12, 3.2), k.grafito, x, 0.12, 0));
            [-1.5, 1.5].forEach((z, j) => k.rotorHorizontal(g, h, x, 0.28, z, 0.75, (i + j) % 2 ? 1 : -1));
        });
        k.rotorEmpuje(g, h, 0, 0, 1.8, 0.55);
        k.gimbal(g, -0.35, -1.2);
        g.add(led('#28d17c', 3.2, 0.1, 0));
        g.add(led('#ff3b5c', -3.2, 0.1, 0));
    },
    fpv(g, h, p, k) {
        g.add(malla(new THREE.BoxGeometry(1.1, 0.25, 1.6), k.grafito));
        const cabina = malla(new THREE.BoxGeometry(0.8, 0.45, 1), p, 0, 0.3, -0.1);
        cabina.rotation.x = -0.15;
        g.add(cabina);
        ESQUINAS.forEach(([sx, sz], i) => {
            const brazo = malla(new THREE.BoxGeometry(0.2, 0.1, 1.5), k.grafito, sx * 0.6, 0, sz * 0.6);
            brazo.rotation.y = Math.atan2(sx, sz);
            g.add(brazo);
            const ducto = malla(new THREE.TorusGeometry(0.72, 0.1, 10, 28), p, sx * 1.15, 0.1, sz * 1.15);
            ducto.rotation.x = Math.PI / 2;
            g.add(ducto);
            k.rotorHorizontal(g, h, sx * 1.15, 0.12, sz * 1.15, 0.62, i % 3 === 0 ? 1 : -1);
        });
        const l = malla(new THREE.CircleGeometry(0.12, 16), k.lente, 0, 0.35, -0.62);
        l.rotation.y = Math.PI;
        g.add(l);
        g.add(led('#28d17c', 0.4, -0.15, 0.8));
        g.add(led('#ff3b5c', -0.4, -0.15, 0.8));
    },
    heli(g, h, p, k) {
        const cabina = malla(new THREE.SphereGeometry(0.9, 22, 16), p, 0, 0, -0.3);
        cabina.scale.set(1, 0.95, 1.5);
        g.add(cabina);
        const vidrio = malla(new THREE.SphereGeometry(0.6, 16, 12), mat('#9fc3dc', { roughness: 0.1, metalness: 0.5 }), 0, 0.2, -1.05);
        vidrio.scale.set(1.1, 0.8, 0.8);
        g.add(vidrio);
        const cola = malla(new THREE.CylinderGeometry(0.1, 0.22, 3, 10), p, 0, 0.3, 1.8);
        cola.rotation.x = Math.PI / 2;
        g.add(cola);
        g.add(malla(new THREE.BoxGeometry(0.08, 0.8, 0.5), p, 0, 0.6, 3.2));
        const rotor = malla(new THREE.BoxGeometry(5.6, 0.04, 0.24), k.grafito, 0, 1.15, -0.3);
        g.add(rotor);
        h.push({ obj: rotor, eje: 'y', vel: 22 });
        const trasero = malla(new THREE.BoxGeometry(0.03, 0.9, 0.12), k.grafito, 0.1, 0.6, 3.2);
        g.add(trasero);
        h.push({ obj: trasero, eje: 'x', vel: 50 });
        [-0.55, 0.55].forEach(x => g.add(malla(new THREE.BoxGeometry(0.07, 0.07, 2), k.grafito, x, -0.95, -0.3)));
        g.add(led('#28d17c', 0.9, -0.1, -0.3));
        g.add(led('#ff3b5c', -0.9, -0.1, -0.3));
    },
    jet(g, h, p, k) {
        const fuselaje = malla(new THREE.CylinderGeometry(0.42, 0.62, 7, 20), p);
        fuselaje.rotation.x = Math.PI / 2;
        g.add(fuselaje);
        const nariz = malla(new THREE.ConeGeometry(0.42, 2.2, 20), p, 0, 0, -4.6);
        nariz.rotation.x = -Math.PI / 2;
        g.add(nariz);
        const cabina = malla(new THREE.SphereGeometry(0.45, 18, 12), mat('#2b3a55', { roughness: 0.1, metalness: 0.6 }), 0, 0.42, -2.4);
        cabina.scale.set(0.8, 0.6, 2.2);
        g.add(cabina);
        const delta = new THREE.Shape();
        delta.moveTo(0, -1.6); delta.lineTo(4.2, 2.2); delta.lineTo(3.9, 2.6); delta.lineTo(0, 2.3);
        delta.lineTo(-3.9, 2.6); delta.lineTo(-4.2, 2.2); delta.closePath();
        const alas = new THREE.Mesh(new THREE.ExtrudeGeometry(delta, { depth: 0.1, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 }), k.claro);
        alas.rotation.x = Math.PI / 2;
        alas.position.set(0, -0.05, 0.2);
        g.add(alas);
        [-0.7, 0.7].forEach((x) => {
            const deriva = malla(new THREE.BoxGeometry(0.08, 1.6, 1.3), p, x, 0.95, 2.6);
            deriva.rotation.z = x * 0.35;
            deriva.rotation.x = -0.3;
            g.add(deriva);
        });
        g.add(malla(new THREE.CylinderGeometry(0.5, 0.45, 0.5, 20, 1, true), k.grafito, 0, 0, 3.7).rotateX(Math.PI / 2));
        const llama = malla(new THREE.ConeGeometry(0.42, 2.4, 16), new THREE.MeshBasicMaterial({ color: '#ff8300', transparent: true, opacity: 0.75 }), 0, 0, 5.1);
        llama.rotation.x = -Math.PI / 2;
        g.add(llama);
        h.push({ obj: llama, pulso: true });
        g.add(led('#28d17c', 4.1, 0, 2.3));
        g.add(led('#ff3b5c', -4.1, 0, 2.3));
    },
    globo(g, h, p) {
        const lienzo = document.createElement('canvas');
        lienzo.width = 256;
        lienzo.height = 32;
        const ctx = lienzo.getContext('2d');
        for (let i = 0; i < 8; i += 1) {
            ctx.fillStyle = i % 2 ? '#ffffff' : `#${p.color.getHexString()}`;
            ctx.fillRect(i * 32, 0, 32, 32);
        }
        const tela = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(lienzo), roughness: 0.7 });
        const sobre = malla(new THREE.SphereGeometry(2.4, 32, 24), tela, 0, 2.6, 0);
        sobre.scale.set(1, 1.2, 1);
        g.add(sobre);
        g.add(malla(new THREE.CylinderGeometry(0.75, 0.9, 1.2, 20, 1, true), tela, 0, -0.1, 0));
        g.add(malla(new THREE.BoxGeometry(0.8, 0.6, 0.8), mat('#8a5a2b', { roughness: 0.9 }), 0, -1.4, 0));
        g.add(led('#ffb347', 0, -0.4, 0));
    },
};

export const construirAeronave = ({ modelo, color, luces, foco }) => {
    const grupo = new THREE.Group();
    grupo.rotation.order = 'YXZ';
    const helices = [];
    CONSTRUCTORES[modelo](grupo, helices, mat(color), crearKit());
    grupo.traverse((o) => { if (o.userData.led) o.visible = luces; });
    const cono = new THREE.Mesh(
        new THREE.ConeGeometry(9, 26, 32, 1, true),
        new THREE.MeshBasicMaterial({ color: '#ff8300', transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false }),
    );
    cono.position.set(0, -13, -3);
    cono.rotation.x = 0.35;
    cono.visible = foco;
    grupo.add(cono);
    return { grupo, helices };
};

export const liberar = (objeto) => objeto?.traverse((o) => {
    o.geometry?.dispose();
    [].concat(o.material || []).forEach((m) => { m.map?.dispose(); m.dispose(); });
});
