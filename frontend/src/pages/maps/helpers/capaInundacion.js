import * as THREE from 'three';
import { crearLluvia, volumenDeLluvia } from './lluviaParticulas';

export const ID_CAPA_INUNDACION = 'inundacion-3d';
const LADO_M = 420000;

const orillaSuave = () => {
    const lienzo = document.createElement('canvas');
    lienzo.width = 256;
    lienzo.height = 256;
    const ctx = lienzo.getContext('2d');
    const degradado = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    degradado.addColorStop(0, '#ffffff');
    degradado.addColorStop(0.82, '#ffffff');
    degradado.addColorStop(1, '#000000');
    ctx.fillStyle = degradado;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(lienzo);
};

export const crearCapaInundacion = (maplibregl, { leer }) => {
    let map = null;
    let renderer = null;
    const escena = new THREE.Scene();
    const camara = new THREE.Camera();
    const agua = new THREE.Mesh(
        new THREE.PlaneGeometry(LADO_M, LADO_M),
        new THREE.MeshBasicMaterial({ color: '#2f78b7', transparent: true, opacity: 0.58, depthWrite: false }),
    );
    const brillo = new THREE.Mesh(
        new THREE.PlaneGeometry(LADO_M, LADO_M),
        new THREE.MeshBasicMaterial({ color: '#bfe3ff', transparent: true, opacity: 0.08, depthWrite: false }),
    );
    brillo.position.z = 0.5;
    escena.add(agua, brillo);
    const disco = new THREE.Mesh(
        new THREE.CircleGeometry(1, 96),
        new THREE.MeshBasicMaterial({ color: '#2f78b7', transparent: true, opacity: 0.62, depthWrite: false, alphaMap: orillaSuave() }),
    );
    escena.add(disco);
    const escenaLluvia = new THREE.Scene();
    const camaraLluvia = new THREE.Camera();
    const lluvia = crearLluvia();
    escenaLluvia.add(lluvia.objeto);
    const matrizEn = (principal, lngLat, altura) => {
        const merc = maplibregl.MercatorCoordinate.fromLngLat(lngLat, altura);
        const s = merc.meterInMercatorCoordinateUnits();
        return principal.clone().multiply(new THREE.Matrix4().makeTranslation(merc.x, merc.y, merc.z).scale(new THREE.Vector3(s, -s, s)));
    };

    return {
        id: ID_CAPA_INUNDACION,
        type: 'custom',
        renderingMode: '3d',
        onAdd(mapa, gl) {
            map = mapa;
            renderer = new THREE.WebGLRenderer({ canvas: mapa.getCanvas(), context: gl, antialias: true });
            renderer.autoClear = false;
        },
        render(gl, args) {
            const { centro, altura, lluvia: estadoLluvia, radio = null } = leer();
            if (!renderer) return;
            const principal = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix);
            renderer.resetState();
            if (centro && altura !== null) {
                camara.projectionMatrix = matrizEn(principal, centro, altura);
                brillo.material.opacity = 0.06 + Math.sin(performance.now() / 700) * 0.03;
                agua.visible = radio === null;
                brillo.visible = radio === null;
                disco.visible = radio !== null;
                if (radio !== null) disco.scale.setScalar(radio);
                renderer.render(escena, camara);
            }
            if (estadoLluvia.activa) {
                const volumen = volumenDeLluvia(map);
                camaraLluvia.projectionMatrix = matrizEn(principal, volumen.centro, volumen.suelo);
                lluvia.actualizar({ ...estadoLluvia, ancho: volumen.ancho, alto: volumen.alto });
                renderer.render(escenaLluvia, camaraLluvia);
            }
            map.triggerRepaint();
        },
        onRemove() {
            agua.geometry.dispose();
            agua.material.dispose();
            brillo.geometry.dispose();
            brillo.material.dispose();
            lluvia.liberar();
            disco.geometry.dispose();
            disco.material.alphaMap?.dispose();
            disco.material.dispose();
            renderer = null;
        },
    };
};
