import { useEffect, useState } from 'react';
import { fetchHomeContent, onHomeChanged } from '@services/eventosService';


export const useHomeContent = () => {
    const [home, setHome] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const load = () => {
            fetchHomeContent()
                .then((data) => { if (!cancelled) setHome(data); })
                .catch((err) => { if (!cancelled) setError(err); })
                .finally(() => { if (!cancelled) setLoading(false); });
        };
        load();
        const off = onHomeChanged(load);
        return () => { cancelled = true; off(); };
    }, []);

    return { home, loading, error };
};
