import { useCallback, useMemo, useState } from 'react';
import { SELECCION_TODAS, geometriaDeSeleccion, seleccionesDisponibles, trazosDeSeleccion } from '../utils/seleccionDescarga';

export const useSeleccionDescarga = (measurements) => {
    const disponibles = useMemo(() => seleccionesDisponibles(measurements), [measurements]);
    const [elegida, setElegida] = useState(null);

    const vigente = elegida === SELECCION_TODAS || disponibles.some(d => d.id === elegida);
    const idElegida = vigente ? elegida : (disponibles[disponibles.length - 1]?.id ?? null);

    const geometria = useMemo(() => geometriaDeSeleccion(disponibles, idElegida), [disponibles, idElegida]);
    const trazos = useMemo(() => trazosDeSeleccion(disponibles, idElegida), [disponibles, idElegida]);

    const elegirPorGeometria = useCallback((geometriaPedida) => {
        const encontrada = disponibles.find(d => d.geometry === geometriaPedida);
        if (encontrada) setElegida(encontrada.id);
    }, [disponibles]);

    return { disponibles, idElegida, setElegida, elegirPorGeometria, geometria, trazos };
};
