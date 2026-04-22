import { useCallback, useState } from 'react';

const FEATURE_SEEN_PREFIX = 'mapalab:feature-seen:';

export const useFeatureSeen = (key) => {
    const storageKey = key ? `${FEATURE_SEEN_PREFIX}${key}` : null;

    const [seen, setSeen] = useState(() => {
        if (!storageKey) return false;
        try {
            return localStorage.getItem(storageKey) === 'true';
        } catch {
            return false;
        }
    });

    const markSeen = useCallback(() => {
        if (!storageKey) return;
        try {
            localStorage.setItem(storageKey, 'true');
        } catch { /* ignore quota/privacy errors */ }
        setSeen(true);
    }, [storageKey]);

    return [seen, markSeen];
};
