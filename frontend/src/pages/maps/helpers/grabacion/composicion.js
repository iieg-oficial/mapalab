import logoMapalab from '@assets/logos/mapalab_large.svg';
import logoIieg from '@assets/logos/iieg_large.svg';
import logoJalisco from '@assets/logos/jalisco_large_dark.svg';
import icoNorte from '@icons/ico_n.svg';
import { fromLonLat } from 'ol/proj';
import { fetchSiluetas } from '@services/municipioService';
import { aPixel, municipioEn, vistaDelMinimapa } from '@pages/maps/helpers/minimapa';
import { dibujarMinimapa } from '@pages/maps/helpers/trazoMinimapa';

const FUENTE = 'Garet, Figtree, system-ui, sans-serif';
const ATRIBUCION = '© IIEG · © CARTO · © OpenStreetMap';
const NARANJA = '#FF8300';
const HALO = 'rgba(255, 255, 255, 0.95)';
const ZOOM_MUNICIPIO = 12;

const cargarImagen = src => new Promise((resolver) => {
    const imagen = new Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = () => resolver(null);
    imagen.src = src;
});

const tenir = (imagen, color) => {
    if (!imagen) return null;
    const lienzo = document.createElement('canvas');
    lienzo.width = imagen.naturalWidth || imagen.width;
    lienzo.height = imagen.naturalHeight || imagen.height;
    const ctx = lienzo.getContext('2d');
    ctx.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, lienzo.width, lienzo.height);
    return lienzo;
};

export const cargarRecursos = async () => {
    const [mapalab, iieg, jalisco, norte, siluetas] = await Promise.all([
        cargarImagen(logoMapalab),
        cargarImagen(logoIieg),
        cargarImagen(logoJalisco),
        cargarImagen(icoNorte),
        fetchSiluetas().catch(() => null),
        document.fonts?.ready,
    ]);
    return { mapalab, iieg, jalisco: tenir(jalisco, '#465055'), norte, siluetas };
};

const proporcion = imagen => (imagen.naturalWidth || imagen.width) / (imagen.naturalHeight || imagen.height);

const conHalo = (ctx, radio, dibujo) => {
    ctx.save();
    ctx.shadowColor = HALO;
    ctx.shadowBlur = radio;
    dibujo();
    ctx.restore();
};

const cubrir = (ctx, fuente, ancho, alto) => {
    const escala = Math.max(ancho / fuente.width, alto / fuente.height);
    const w = ancho / escala;
    const h = alto / escala;
    ctx.drawImage(fuente, (fuente.width - w) / 2, (fuente.height - h) / 2, w, h, 0, 0, ancho, alto);
};

const recortar = (ctx, texto, maximo) => {
    if (ctx.measureText(texto).width <= maximo) return texto;
    let corto = texto;
    while (corto.length > 1 && ctx.measureText(`${corto}…`).width > maximo) corto = corto.slice(0, -1);
    return `${corto}…`;
};

const dibujarNorte = (ctx, norte, { ancho, alto, margen, rumbo }) => {
    if (!norte) return;
    const h = alto * 0.07;
    const w = h * proporcion(norte);
    conHalo(ctx, h * 0.08, () => {
        ctx.translate(ancho - margen - h / 2, margen + h / 2);
        ctx.rotate((-rumbo * Math.PI) / 180);
        ctx.drawImage(norte, -w / 2, -h / 2, w, h);
    });
};

const dibujarRastro = (ctx, puntos, lado) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(92, 36, 114, 0.85)';
    ctx.lineWidth = Math.max(1.5, lado * 0.018);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.restore();
};

const dibujarMarcador = (ctx, [x, y], rumbo, lado) => {
    const r = lado * 0.05;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rumbo * Math.PI) / 180);
    ctx.fillStyle = 'rgba(255, 131, 0, 0.35)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 1.6, -r * 4);
    ctx.lineTo(r * 1.6, -r * 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5C2472';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = r * 0.4;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

const dibujarUbicacion = (ctx, siluetas, { x, y, lado, ubicacion }) => {
    if (!siluetas?.estado || !ubicacion) return;
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(lado);
    lienzo.height = Math.round(lado);
    const mini = lienzo.getContext('2d');
    const { centro, zoom, extension } = ubicacion;
    const cerca = zoom >= ZOOM_MUNICIPIO;
    const municipio = cerca ? municipioEn(siluetas.municipios, centro) : null;
    const vista = vistaDelMinimapa({
        centro,
        zoom,
        extensionEstado: siluetas.estado.getExtent(),
        extensionMunicipio: municipio?.geometry?.getExtent() ?? null,
        lado: lienzo.width,
    });
    dibujarMinimapa(mini, { lado: lienzo.width, vista, estado: siluetas.estado, municipio, extensionVista: extension, atenuado: !cerca });
    if (ubicacion.rastro?.length > 1) dibujarRastro(mini, ubicacion.rastro.map(p => aPixel(vista, lienzo.width, fromLonLat(p))), lienzo.width);
    if (ubicacion.marcador) dibujarMarcador(mini, aPixel(vista, lienzo.width, ubicacion.marcador.coord), ubicacion.marcador.rumbo, lienzo.width);
    conHalo(ctx, lado * 0.02, () => ctx.drawImage(lienzo, x, y, lado, lado));
};

const medidasDatos = ({ ancho, alto, panel, perfil }) => {
    const letra = Math.max(11, alto * 0.026);
    const altoIndicadores = panel ? ancho * (panel.height / panel.width) : 0;
    const altoPerfil = perfil ? ancho * (perfil.height / perfil.width) * 0.8 : 0;
    const separacion = letra * 0.7;
    return { letra, altoIndicadores, altoPerfil, separacion, altoTotal: letra * 1.25 + altoIndicadores + (altoPerfil ? separacion + altoPerfil : 0) };
};

const dibujarDatos = (ctx, { x, yBase, ancho, titulo, totalCapas, panel, perfil, medidas }) => {
    const { letra, altoIndicadores, altoPerfil, separacion, altoTotal } = medidas;
    const y = yBase - altoTotal;
    const base = y + letra;
    const radio = letra * 0.55;
    ctx.save();
    ctx.font = `700 ${letra}px ${FUENTE}`;
    ctx.textBaseline = 'alphabetic';
    const texto = recortar(ctx, titulo || 'Mapa', ancho - (totalCapas > 1 ? radio * 3 : 0));
    conHalo(ctx, letra * 0.35, () => {
        ctx.fillStyle = NARANJA;
        ctx.fillText(texto, x, base);
    });
    if (totalCapas > 1) {
        const cx = x + ctx.measureText(texto).width + radio + letra * 0.35;
        const cy = base - letra * 0.35;
        ctx.fillStyle = NARANJA;
        ctx.beginPath();
        ctx.arc(cx, cy, radio, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `800 ${letra * 0.68}px ${FUENTE}`;
        ctx.textAlign = 'center';
        ctx.fillText(String(totalCapas), cx, cy + letra * 0.24);
    }
    ctx.restore();
    const yIndicadores = y + letra * 1.25;
    if (panel) conHalo(ctx, letra * 0.3, () => ctx.drawImage(panel, x, yIndicadores, ancho, altoIndicadores));
    if (perfil && altoPerfil) ctx.drawImage(perfil, x, yIndicadores + altoIndicadores + separacion, ancho, altoPerfil);
};

const dibujarLogos = (ctx, recursos, { x, ancho, base, alto }) => {
    const anchos = [recursos.iieg, recursos.jalisco].map(logo => (logo ? proporcion(logo) : 0));
    const altoLogo = Math.min(Math.max(10, alto * 0.026), (ancho * 0.92) / Math.max(1, anchos[0] + anchos[1]));
    if (recursos.iieg) conHalo(ctx, altoLogo * 0.2, () => ctx.drawImage(recursos.iieg, x, base - altoLogo, altoLogo * anchos[0], altoLogo));
    if (recursos.jalisco) conHalo(ctx, altoLogo * 0.2, () => ctx.drawImage(recursos.jalisco, x + ancho - altoLogo * anchos[1], base - altoLogo, altoLogo * anchos[1], altoLogo));
};

export const componerCuadro = (ctx, opciones) => {
    const { ancho, alto, mapa, recursos, rumbo = 0, ubicacion, titulo, totalCapas = 1, compacto = false, instrumentos, perfil } = opciones;
    const margen = Math.round(Math.min(ancho, alto) * 0.04);
    const piso = alto - margen;
    const letraAtribucion = Math.max(9, alto * 0.016);
    ctx.save();
    ctx.clearRect(0, 0, ancho, alto);
    if (mapa) cubrir(ctx, mapa, ancho, alto);
    if (recursos.mapalab) {
        const h = alto * (compacto ? 0.035 : 0.045);
        conHalo(ctx, h * 0.15, () => ctx.drawImage(recursos.mapalab, margen, margen, h * proporcion(recursos.mapalab), h));
    }
    dibujarNorte(ctx, recursos.norte, { ancho, alto, margen, rumbo });
    const lado = ancho * (compacto ? 0.22 : 0.12);
    dibujarUbicacion(ctx, recursos.siluetas, { x: ancho - margen - lado, y: piso - lado, lado, ubicacion });
    dibujarLogos(ctx, recursos, { x: ancho - margen - lado, ancho: lado, base: piso - lado - margen * 0.4, alto });
    const anchoDatos = ancho * (compacto ? 0.46 : 0.26);
    const panel = compacto ? null : instrumentos;
    const perfilVisible = compacto ? null : perfil;
    const medidas = medidasDatos({ ancho: anchoDatos, alto, panel, perfil: perfilVisible });
    dibujarDatos(ctx, { x: margen, yBase: piso, ancho: anchoDatos, titulo, totalCapas, panel, perfil: perfilVisible, medidas });
    ctx.font = `600 ${letraAtribucion}px ${FUENTE}`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = letraAtribucion * 0.4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(ATRIBUCION, ancho / 2, compacto ? margen + letraAtribucion : alto - margen);
    ctx.restore();
};
