const SIN_SOPORTE = 'Tu navegador no puede generar este formato';

export const opcionesDeArchivo = ({ mp4, webm }, { gif = true, video = 'Video' } = {}) => [
    { value: 'mp4', label: 'MP4', disabled: !mp4, tooltip: mp4 ? `${video}. Se abre en casi cualquier programa` : SIN_SOPORTE },
    { value: 'webm', label: 'WebM', disabled: !webm, tooltip: webm ? `${video}. Más ligero, pensado para la web` : SIN_SOPORTE },
    ...(gif ? [{ value: 'gif', label: 'GIF', tooltip: 'Animación ligera en loop, cuadrada' }] : []),
];

export const elegible = (opciones, actual) => {
    if (opciones.some(o => o.value === actual && !o.disabled)) return actual;
    return opciones.find(o => !o.disabled)?.value ?? actual;
};
