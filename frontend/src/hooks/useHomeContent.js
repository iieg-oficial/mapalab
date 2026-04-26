import { useEffect, useState } from 'react';
import { fetchHomeContent } from '@services/eventosService';


export const useHomeContent = () => {
    const [home, setHome] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        fetchHomeContent()
            .then((data) => { if (!cancelled) setHome(data); })
            .catch((err) => { if (!cancelled) setError(err); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    return { home, loading, error };
};
