const M_POR_GRADO_LAT = 110574;
const RAD = Math.PI / 180;
export const AGL_MINIMO = 12;
export const AGL_MAXIMO = 3000;
const CAMARA_RANGO = [-75, 30];
const GIRO_MAXIMO = 52;

export const amortiguar = (actual, meta, rapidez, dt) => actual + (meta - actual) * (1 - Math.exp(-rapidez * dt));

export const acotar = (valor, min, max) => Math.min(max, Math.max(min, valor));

export const anguloCorto = grados => ((((grados + 180) % 360) + 360) % 360) - 180;

export const metrosPorGradoLng = lat => 111320 * Math.cos(lat * RAD);

export const desplazar = ([lng, lat], este, norte) => [lng + este / metrosPorGradoLng(lat), lat + norte / M_POR_GRADO_LAT];

export const distancia = ([lng1, lat1], [lng2, lat2]) => {
    const este = (lng2 - lng1) * metrosPorGradoLng((lat1 + lat2) / 2);
    const norte = (lat2 - lat1) * M_POR_GRADO_LAT;
    return { este, norte, metros: Math.hypot(este, norte), rumbo: (Math.atan2(este, norte) / RAD + 360) % 360 };
};

export const crearDron = (lngLat, suelo, rumbo) => ({
    lngLat,
    alt: suelo + 300,
    agl: 300,
    rumbo,
    camara: -12,
    vEste: 0,
    vNorte: 0,
    vVert: 0,
    giro: 0,
    alabeo: 0,
    cabeceo: 0,
    vsReal: 0,
});

export const SIN_ENTRADA = { avance: 0, lateral: 0, giro: 0, sube: 0, mira: 0 };

export const entradaGuiada = (dron, { destino, auto, t, centro, radio }) => {
    if (destino) {
        const { metros, rumbo } = distancia(dron.lngLat, destino);
        if (metros < 120) return { entrada: SIN_ENTRADA, llego: true };
        const dif = anguloCorto(rumbo - dron.rumbo);
        return {
            entrada: { ...SIN_ENTRADA, giro: acotar(-dif / 25, -1, 1), avance: Math.abs(dif) < 35 ? Math.min(1, metros / 1500) : 0.12 },
            llego: false,
        };
    }
    if (!auto) return null;
    const { metros, rumbo } = distancia(dron.lngLat, centro);
    const giro = metros > radio
        ? acotar(-anguloCorto(rumbo - dron.rumbo) / 30, -1, 1)
        : Math.sin(t * 0.13) * 0.28;
    return { entrada: { ...SIN_ENTRADA, avance: 0.6, giro }, llego: false };
};

export const pasoDron = (dron, entrada, { perfil, velocidad, seguir, dt, sueloEn, auto = false }) => {
    const vmax = perfil.vel[velocidad] / 3.6;
    const avance = perfil.perdida && !auto ? Math.max(entrada.avance, perfil.perdida / perfil.vel[velocidad]) : entrada.avance;
    const r = dron.rumbo * RAD;
    const [fe, fn] = [Math.sin(r), Math.cos(r)];
    const vEste = amortiguar(dron.vEste, (fe * avance + fn * entrada.lateral) * vmax, perfil.acel, dt);
    const vNorte = amortiguar(dron.vNorte, (fn * avance - fe * entrada.lateral) * vmax, perfil.acel, dt);
    const giro = amortiguar(dron.giro, entrada.giro * perfil.giro * GIRO_MAXIMO, 4, dt);
    const rumbo = (((dron.rumbo - giro * dt) % 360) + 360) % 360;
    const [ve, vn] = perfil.viento || [0, 0];
    const lngLat = desplazar(dron.lngLat, (vEste + ve) * dt, (vNorte + vn) * dt);
    const piso = sueloEn(lngLat);
    let { alt, agl, vVert } = dron;
    if (seguir) {
        agl = acotar(agl + entrada.sube * perfil.subida * dt, AGL_MINIMO, AGL_MAXIMO);
        alt = amortiguar(alt, piso + agl, 2.2, dt);
    } else {
        vVert = amortiguar(vVert, entrada.sube * perfil.subida, 3, dt);
        alt = Math.min(piso + AGL_MAXIMO, alt + vVert * dt);
        agl = alt - piso;
    }
    if (alt < piso + AGL_MINIMO) {
        alt = piso + AGL_MINIMO;
        agl = Math.max(agl, AGL_MINIMO);
    }
    const adelante = (vEste * fe + vNorte * fn) / Math.max(vmax, 1);
    const derecha = (vEste * fn - vNorte * fe) / Math.max(vmax, 1);
    const esGlobo = perfil.tipo === 'globo';
    const esAla = perfil.tipo === 'ala';
    return {
        ...dron,
        lngLat,
        alt,
        agl,
        vVert,
        vEste,
        vNorte,
        giro,
        rumbo,
        camara: acotar(dron.camara + entrada.mira * 45 * dt, ...CAMARA_RANGO),
        alabeo: amortiguar(dron.alabeo, esGlobo ? 0 : giro * RAD * (esAla ? 0.9 : 0.45) - derecha * 0.22, 3, dt),
        cabeceo: amortiguar(dron.cabeceo, esGlobo || esAla ? 0 : -adelante * 0.28, 3, dt),
        vsReal: amortiguar(dron.vsReal, (alt - dron.alt) / Math.max(dt, 0.001), 3, dt),
        piso,
    };
};

export const rapidezKmh = (dron, seguir) => Math.hypot(dron.vEste, dron.vNorte, seguir ? 0 : dron.vVert) * 3.6;

export const mirarCamara = (dron, grados) => ({ ...dron, camara: acotar(dron.camara + grados, ...CAMARA_RANGO) });
