import { useEffect, useState } from 'react';
import { fetchSymbolCatalog } from '@services/symbolsService';

export const useSymbolCatalog = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await fetchSymbolCatalog();
                if (!cancelled) setCategories(data);
            } catch (err) {
                if (!cancelled) setError(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    return { categories, loading, error };
};
