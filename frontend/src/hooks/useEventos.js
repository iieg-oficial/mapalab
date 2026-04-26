import { useEffect, useState } from 'react';
import { fetchEventos } from '@services/eventosService';


export const useEventos = () => {
    const [eventos, setEventos] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        fetchEventos()
            .then((data) => { if (!cancelled) setEventos(data); })
            .catch((err) => { if (!cancelled) setError(err); });
        return () => { cancelled = true; };
    }, []);

    return { eventos, error };
};
