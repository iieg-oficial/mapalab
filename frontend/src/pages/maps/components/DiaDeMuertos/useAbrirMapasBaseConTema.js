import { useEffect, useRef } from 'react';
import { useDecoracionEvento } from '@hooks/useEvento';
import { esDiaDeMuertos } from '@pages/maps/helpers/eventoDiversion';

const MENU = 'basemaps';
const RETRASO_MS = 300;

export const useAbrirMapasBaseConTema = ({ setAutoOpenMenuId, setIsHovered, abrirSider }) => {
    const activa = esDiaDeMuertos(useDecoracionEvento());
    const antes = useRef(activa);
    const acciones = useRef({});
    acciones.current = { setAutoOpenMenuId, setIsHovered, abrirSider };

    useEffect(() => {
        const recienEncendido = activa && !antes.current;
        antes.current = activa;
        if (!recienEncendido) return undefined;
        const { abrirSider: abrir, setIsHovered: expandir } = acciones.current;
        if (abrir) abrir();
        else expandir?.(true);
        const timer = setTimeout(() => acciones.current.setAutoOpenMenuId?.(MENU), RETRASO_MS);
        return () => clearTimeout(timer);
    }, [activa]);
};
