const HERRAMIENTA = 'Medir área y seleccionar';

const FORMATOS = [
    { value: 'png', label: 'PNG', tooltip: 'Imagen con la mejor nitidez' },
    { value: 'jpeg', label: 'JPEG', tooltip: 'Imagen más ligera, buena para correo o WhatsApp' },
    { value: 'pdf', label: 'PDF', tooltip: 'Documento con título y leyendas' },
];

const VISTAS = [
    {
        value: 'viewport',
        label: 'Área',
        tooltip: 'Descarga el recuadro que ajustas sobre la vista actual',
    },
    {
        value: 'full-state',
        label: 'Jalisco',
        tooltip: 'Descarga todo el estado, sin importar el zoom',
    },
    {
        value: 'seleccion',
        label: 'Selección',
        tooltip: `Descarga solo el interior del último polígono que dibujaste con ${HERRAMIENTA}`,
    },
];

export const VISTA_ANALITICA = { viewport: 'vista_actual', 'full-state': 'estado_completo', seleccion: 'seleccion' };

export const opcionesTipo = isSwipe => [
    { value: 'imagen', label: 'Imagen', tooltip: 'PNG, JPEG o PDF del mapa' },
    isSwipe
        ? { value: 'animacion', label: 'Animación', disabled: true, tooltip: 'En el comparador no se puede grabar: hay dos mapas a la vez' }
        : { value: 'animacion', label: 'Animación', tooltip: 'BETA · Video o GIF de una vuelta en 3D o de una ruta en dron' },
];

export const opcionesFormato = (isSwipe) => {
    if (!isSwipe) return FORMATOS;
    return FORMATOS.map(f => (f.value === 'png' ? f : { ...f, disabled: true, tooltip: 'En el comparador solo se descarga PNG' }));
};

export const opcionesVista = ({ haySeleccion, isSwipe, es3d }) => {
    if (es3d) return VISTAS.filter(v => v.value === 'viewport');
    return VISTAS.filter(v => v.value !== 'seleccion' || (haySeleccion && !isSwipe));
};

export const textoBotonDescarga = (viewType, format) => (viewType === 'viewport' ? 'Ir a seleccionar área' : `Descargar ${format.toUpperCase()}`);

export const tooltipBotonDescarga = (viewType) => (viewType === 'viewport'
    ? 'Te lleva al mapa para ajustar el recuadro antes de descargar'
    : 'Genera y descarga el archivo con estas opciones');
