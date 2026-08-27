import { useEffect, useState } from 'react';

const STORAGE_KEY = 'mapalab.activeLayers.avisoSeleccionVisto';

export const AVISO_SELECCION = 'Al seleccionar un punto en el mapa, éste mostrará información de esta capa. Puedes cambiar la selección dando clic en la capa que necesites visualizar.';

export const avisoSeleccionVisto = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
};

export const marcarAvisoSeleccion = () => {
    try {
        localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
        /* ignore */
    }
};

export const useAvisoSeleccion = (isSelected) => {
    const [mostrar] = useState(() => !avisoSeleccionVisto());

    useEffect(() => {
        if (isSelected && mostrar) marcarAvisoSeleccion();
    }, [isSelected, mostrar]);

    return mostrar ? AVISO_SELECCION : null;
};
