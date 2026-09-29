import * as THREE from 'three';

export const ID_CAPA_INUNDACION = 'inundacion-3d';
const LADO_M = 420000;

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
            const { centro, altura } = leer();
            if (!renderer || !centro || altura === null) return;
            const merc = maplibregl.MercatorCoordinate.fromLngLat(centro, altura);
            const s = merc.meterInMercatorCoordinateUnits();
            camara.projectionMatrix = new THREE.Matrix4()
                .fromArray(args.defaultProjectionData.mainMatrix)
                .multiply(new THREE.Matrix4().makeTranslation(merc.x, merc.y, merc.z).scale(new THREE.Vector3(s, -s, s)));
            brillo.material.opacity = 0.06 + Math.sin(performance.now() / 700) * 0.03;
            renderer.resetState();
            renderer.render(escena, camara);
            map.triggerRepaint();
        },
        onRemove() {
            agua.geometry.dispose();
            agua.material.dispose();
            brillo.geometry.dispose();
            brillo.material.dispose();
            renderer = null;
        },
    };
};
