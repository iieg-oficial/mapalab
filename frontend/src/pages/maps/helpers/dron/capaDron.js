import * as THREE from 'three';
import { construirAeronave, liberar } from './modelosDron';
import { crearExplosion } from './explosionDron';

export const ID_CAPA_DRON = 'dron-3d';
const RAD = Math.PI / 180;
const ESCALA = 3.2;
const PUNTOS_ESTELA = 200;
const PASO_ESTELA = 0.12;

const texturaSombra = () => {
    const lienzo = document.createElement('canvas');
    lienzo.width = 128;
    lienzo.height = 128;
    const ctx = lienzo.getContext('2d');
    const r = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    r.addColorStop(0, 'rgba(20, 16, 30, 0.75)');
    r.addColorStop(1, 'rgba(20, 16, 30, 0)');
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(lienzo);
};

const escenaConLuz = () => {
    const escena = new THREE.Scene();
    escena.add(new THREE.HemisphereLight('#f4f1ff', '#6f6a55', 1.6));
    const sol = new THREE.DirectionalLight('#fff4e0', 1.8);
    sol.position.set(-0.6, 1, 0.35);
    escena.add(sol);
    return escena;
};

export const crearCapaDron = (maplibregl, { leer, alPantalla }) => {
    let map = null;
    let renderer = null;
    let aeronave = null;
    let clave = '';
    let reloj = 0;
    let anterior = performance.now();
    const puntos = [];
    const escenaDron = escenaConLuz();
    const escenaRastro = new THREE.Scene();
    const camDron = new THREE.Camera();
    const camRastro = new THREE.Camera();
    const sombra = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent: true, depthWrite: false }),
    );
    escenaRastro.add(sombra);
    const estelaPos = new Float32Array(PUNTOS_ESTELA * 3);
    const estelaGeo = new THREE.BufferGeometry();
    estelaGeo.setAttribute('position', new THREE.BufferAttribute(estelaPos, 3));
    const estela = new THREE.Line(estelaGeo, new THREE.LineBasicMaterial({ color: '#ff8300', transparent: true, opacity: 0.6 }));
    estela.frustumCulled = false;
    escenaRastro.add(estela);
    const explosion = crearExplosion();
    escenaRastro.add(explosion.grupo);
    const rotacionX = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    const punto = new THREE.Vector4();

    const reconstruir = (config) => {
        const nueva = `${config.modelo}|${config.color}|${config.luces}|${config.foco}`;
        if (nueva === clave) return;
        clave = nueva;
        if (aeronave) {
            escenaDron.remove(aeronave.grupo);
            liberar(aeronave.grupo);
        }
        aeronave = construirAeronave(config);
        aeronave.grupo.scale.setScalar(ESCALA);
        escenaDron.add(aeronave.grupo);
    };

    const actualizarEstela = (merc, s, activa, dt) => {
        estela.visible = activa;
        if (!activa) {
            puntos.length = 0;
            return;
        }
        reloj += dt;
        if (reloj > PASO_ESTELA) {
            reloj = 0;
            puntos.unshift([merc.x, merc.y, merc.z]);
            if (puntos.length > PUNTOS_ESTELA) puntos.pop();
        }
        puntos.forEach(([x, y, z], i) => {
            estelaPos[i * 3] = (x - merc.x) / s;
            estelaPos[i * 3 + 1] = -(y - merc.y) / s;
            estelaPos[i * 3 + 2] = (z - merc.z) / s - 1.5;
        });
        estelaGeo.setDrawRange(0, puntos.length);
        estelaGeo.attributes.position.needsUpdate = true;
    };

    return {
        id: ID_CAPA_DRON,
        type: 'custom',
        renderingMode: '3d',
        onAdd(mapa, gl) {
            map = mapa;
            renderer = new THREE.WebGLRenderer({ canvas: mapa.getCanvas(), context: gl, antialias: true });
            renderer.autoClear = false;
        },
        render(gl, args) {
            const { dron, config, perfil, choqueDesde } = leer();
            if (!dron || !renderer) return;
            const ahora = performance.now();
            const dt = Math.min(0.05, (ahora - anterior) / 1000);
            anterior = ahora;
            reconstruir(config);
            const merc = maplibregl.MercatorCoordinate.fromLngLat(dron.lngLat, dron.alt);
            const s = merc.meterInMercatorCoordinateUnits();
            const principal = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix);
            const base = principal.multiply(new THREE.Matrix4().makeTranslation(merc.x, merc.y, merc.z).scale(new THREE.Vector3(s, -s, s)));
            camRastro.projectionMatrix = base;
            camDron.projectionMatrix = base.clone().multiply(rotacionX);

            const balanceo = perfil.tipo === 'globo' ? Math.sin(ahora / 900) * 0.04 : 0;
            const estallando = explosion.actualizar(choqueDesde ?? null);
            aeronave.grupo.visible = config.tercera && !estallando;
            aeronave.grupo.rotation.set(dron.cabeceo + balanceo, -dron.rumbo * RAD, dron.alabeo);
            aeronave.helices.forEach((h) => {
                if (h.pulso) h.obj.scale.set(1, 0.8 + Math.random() * 0.45, 1);
                else h.obj.rotation[h.eje] += dt * h.vel;
            });

            const agl = dron.alt - (dron.piso ?? dron.alt);
            sombra.visible = config.tercera && !estallando;
            sombra.position.set(0, 0, -agl + 0.4);
            sombra.scale.setScalar((perfil.tipo === 'ala' ? 36 : 22) * (1 + agl / 400));
            sombra.material.opacity = Math.max(0.08, Math.exp(-agl / 260));
            actualizarEstela(merc, s, config.estela, dt);

            renderer.resetState();
            renderer.render(escenaRastro, camRastro);
            renderer.render(escenaDron, camDron);

            const caja = map.getCanvas().getBoundingClientRect();
            const aPantalla = (z) => {
                punto.set(0, 0, z, 1).applyMatrix4(base);
                return punto.w > 0 ? [caja.left + ((punto.x / punto.w + 1) / 2) * caja.width, caja.top + ((1 - punto.y / punto.w) / 2) * caja.height] : null;
            };
            const alto = perfil.tipo === 'globo' ? 16 : 3;
            const arriba = config.tercera ? aPantalla(alto * ESCALA * 0.75) : null;
            const abajo = config.tercera ? aPantalla(-ESCALA * 1.2) : null;
            alPantalla(arriba && abajo ? { x: arriba[0], arriba: arriba[1], abajo: abajo[1] } : null);
            map.triggerRepaint();
        },
        onRemove() {
            if (aeronave) liberar(aeronave.grupo);
            liberar(escenaRastro);
            aeronave = null;
            clave = '';
            renderer = null;
        },
    };
};
