import { useEffect, useState } from 'react';
import { fetchEventos, onEventosChanged } from '@services/eventosService';


export const useEventos = () => {
    const [eventos, setEventos] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const load = () => {
            fetchEventos()
                .then((data) => { if (!cancelled) setEventos(data); })
                .catch((err) => { if (!cancelled) setError(err); });
        };
        load();
        const off = onEventosChanged(load);
        return () => { cancelled = true; off(); };
    }, []);

    return { eventos, error };
};
