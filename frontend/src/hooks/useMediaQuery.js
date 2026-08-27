import { useEffect, useState } from 'react';

const coincide = (query) => {
    try { return window.matchMedia(query).matches; } catch { return false; }
};

export const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(() => coincide(query));

    useEffect(() => {
        let mq;
        try { mq = window.matchMedia(query); } catch { return undefined; }
        const handler = (e) => setMatches(e.matches);
        setMatches(mq.matches);
        mq.addEventListener?.('change', handler);
        return () => mq.removeEventListener?.('change', handler);
    }, [query]);

    return matches;
};
