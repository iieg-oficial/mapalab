import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { useEventoContext } from '@hooks/useEvento';
import { slugifyTitulo } from '@pages/maps/helpers/eventoHelpers';

export const useAutoOpenEventoFromUrl = ({ setAutoOpenMenuId, setIsHovered }) => {
    const [searchParams] = useSearchParams();
    const { eventos, loading } = useEventoContext();
    const processedRef = useRef(false);

    useEffect(() => {
        if (processedRef.current || loading) return;
        const target = (searchParams.get('evento') || '').trim();
        if (!target) return;
        if (!Array.isArray(eventos) || eventos.length === 0) return;

        const match = eventos.find((e) => {
            if (!e) return false;
            if (String(e.id) === target) return true;
            if (e.slug && e.slug === target) return true;
            return slugifyTitulo(e.titulo) === target;
        });
        if (!match) return;

        processedRef.current = true;
        setIsHovered?.(true);
        setTimeout(() => setAutoOpenMenuId?.(`ext-evento-${match.id}`), 300);
    }, [searchParams, eventos, loading, setAutoOpenMenuId, setIsHovered]);
};
