const SITE_URL = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');
const BASE_PATH = (import.meta.env.VITE_BASE_PATH || '/').replace(/\/$/, '');

export const buildMcpUrl = (origin = typeof window !== 'undefined' ? window.location.origin : '') =>
    `${SITE_URL || origin}${BASE_PATH}/mcp`;

export const CLIENTS = [
    { id: 'claude', name: 'Claude (web y app)', how: 'Ajustes › Conectores › Agregar conector personalizado y pega la URL.' },
    { id: 'claude-code', name: 'Claude Code', how: 'claude mcp add --transport http mapalab', withUrl: true },
    { id: 'others', name: 'Otros asistentes', how: 'Cualquier cliente MCP con transporte Streamable HTTP. No pide llave ni cuenta.' },
];

export const TOOLS = [
    { id: 'search_layers', name: 'Buscar capas', detail: 'Encuentra capas por tema o por texto.' },
    { id: 'describe_layer', name: 'Describir capa', detail: 'Fuente, metodología, cifras clave y años disponibles.' },
    { id: 'municipios', name: 'Municipios', detail: 'Los 125 municipios de Jalisco con su clave INEGI.' },
    { id: 'layer_table', name: 'Tabla de una capa', detail: 'Filas filtradas por municipio, año o campo.' },
    { id: 'layer_stats', name: 'Cifras de una capa', detail: 'Conteos, sumas, promedios y repartos por clase.' },
    { id: 'create_map', name: 'Crear mapa', detail: 'Arma un mapa de MapaLab y devuelve su enlace.' },
];

export const EXAMPLES = [
    '¿Cuántos homicidios dolosos hubo en Tonalá en 2024?',
    'Hazme un mapa de las primarias de Zapopan.',
    '¿Qué municipios tienen más unidades de salud de primer nivel?',
];

export const FACTS = [
    { id: 'public', title: 'Datos públicos', detail: 'Las mismas capas que ves en MapaLab, sin cuenta ni llave.' },
    {
        id: 'limits',
        title: 'Límites compartidos',
        detail: 'El servicio es para todos.',
        info: 'Hay un tope de consultas por minuto para todo el sitio; si se alcanza, espera un momento y vuelve a intentar.',
    },
    {
        id: 'privacy',
        title: 'Tus preguntas no se guardan',
        detail: 'Solo registramos qué herramienta se usó.',
        info: 'Se guarda la herramienta, si funcionó, cuánto tardó y el nombre del asistente. No guardamos tus preguntas, sus argumentos ni tu IP; el registro se borra a los 90 días.',
    },
    {
        id: 'contact',
        title: 'Contacto',
        detail: 'contacto@iieg.gob.mx',
        href: 'mailto:contacto@iieg.gob.mx',
    },
];
