import { useEffect, useState } from 'react';
import { fetchEventos, onEventosChanged } from '@services/eventosService';


export const useEventos = () => {
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const load = () => {
            setLoading(true);
            fetchEventos()
                .then((data) => {
                    if (cancelled) return;
                    setEventos(data);
                    setError(null);
                })
                .catch((err) => { if (!cancelled) setError(err); })
                .finally(() => { if (!cancelled) setLoading(false); });
        };
        load();
        const off = onEventosChanged(load);
        return () => { cancelled = true; off(); };
    }, []);

    return { eventos, loading, error };
};
