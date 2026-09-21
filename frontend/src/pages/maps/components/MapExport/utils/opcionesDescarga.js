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
        nota: 'Recorta con el recuadro guía sobre la vista actual.',
    },
    {
        value: 'full-state',
        label: 'Jalisco',
        tooltip: 'Descarga todo el estado, sin importar el zoom',
        nota: 'Todo el estado, automático.',
    },
    {
        value: 'seleccion',
        label: 'Seleccionados',
        tooltip: `Descarga solo el interior del último polígono que dibujaste con ${HERRAMIENTA}`,
        nota: 'Solo el interior de tu último polígono; lo de afuera queda en blanco.',
    },
];

export const VISTA_ANALITICA = { viewport: 'vista_actual', 'full-state': 'estado_completo', seleccion: 'seleccion' };

export const opcionesFormato = (isSwipe) => {
    if (!isSwipe) return FORMATOS;
    return [
        ...FORMATOS.map(f => (f.value === 'png' ? f : { ...f, disabled: true, tooltip: 'En el comparador solo se descarga PNG' })),
        { value: 'gif', label: 'GIF', disabled: true, tooltip: 'Próximamente: animación del comparador' },
    ];
};

export const opcionesVista = ({ haySeleccion, isSwipe }) => VISTAS.map(({ value, label, tooltip }) => {
    const v = { value, label, tooltip };
    if (v.value !== 'seleccion') return v;
    if (isSwipe) return { ...v, disabled: true, tooltip: 'No disponible en el comparador' };
    if (!haySeleccion) return { ...v, disabled: true, tooltip: `Dibuja un polígono con ${HERRAMIENTA} para usar esta opción` };
    return v;
});

export const notaVista = (viewType) => VISTAS.find(v => v.value === viewType)?.nota || '';

export const textoBotonDescarga = (viewType, format) => (viewType === 'viewport' ? 'Ir a seleccionar área' : `Descargar ${format.toUpperCase()}`);

export const tooltipBotonDescarga = (viewType) => (viewType === 'viewport'
    ? 'Te lleva al mapa para ajustar el recuadro antes de descargar'
    : 'Genera y descarga el archivo con estas opciones');
