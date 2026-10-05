import * as THREE from 'three';
import { construirEdificio, liberarGrupo } from './modeloEdificio';
import { crearAvatarGenerico } from './avatarGenerico';

export const ID_CAPA_EDIFICIO = 'instituto-3d';
const RAD = Math.PI / 180;

const escenaConLuz = () => {
    const escena = new THREE.Scene();
    escena.add(new THREE.HemisphereLight('#FFFFFF', '#8A8270', 1.9));
    const sol = new THREE.DirectionalLight('#FFF4E0', 1.4);
    sol.position.set(-0.5, 0.35, 1);
    escena.add(sol);
    return escena;
};

export const crearCapaEdificio = (maplibregl, edificio, { leer }) => {
    let renderer = null;
    let map = null;
    const escena = escenaConLuz();
    const modelo = construirEdificio(edificio);
    const avatar = crearAvatarGenerico();
    escena.add(modelo, avatar.grupo);
    const camara = new THREE.Camera();

    return {
        id: ID_CAPA_EDIFICIO,
        type: 'custom',
        renderingMode: '3d',
        onAdd(mapa, gl) {
            map = mapa;
            renderer = new THREE.WebGLRenderer({ canvas: mapa.getCanvas(), context: gl, antialias: true });
            renderer.autoClear = false;
        },
        render(gl, args) {
            const { caminante, alturaBase, tercera } = leer();
            if (!renderer || alturaBase === null) return;
            const merc = maplibregl.MercatorCoordinate.fromLngLat(edificio.origen, alturaBase);
            const s = merc.meterInMercatorCoordinateUnits();
            camara.projectionMatrix = new THREE.Matrix4()
                .fromArray(args.defaultProjectionData.mainMatrix)
                .multiply(new THREE.Matrix4().makeTranslation(merc.x, merc.y, merc.z).scale(new THREE.Vector3(s, -s, s)));
            avatar.grupo.visible = !!caminante && tercera;
            if (caminante) {
                avatar.grupo.position.set(caminante.x, caminante.y, caminante.z);
                avatar.grupo.rotation.set(0, 0, -caminante.rumbo * RAD);
                avatar.animar(caminante.paso, caminante.moviendo);
            }
            renderer.resetState();
            renderer.render(escena, camara);
            map.triggerRepaint();
        },
        onRemove() {
            liberarGrupo(escena);
            renderer?.dispose();
            renderer = null;
        },
    };
};
