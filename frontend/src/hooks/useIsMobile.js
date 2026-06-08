import { useEffect, useState } from 'react';
import { MOBILE_MEDIA_QUERY } from '@constants/sider';

const query = () => {
    try { return window.matchMedia(MOBILE_MEDIA_QUERY).matches; } catch { return false; }
};

export const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(query);

    useEffect(() => {
        let mq;
        try { mq = window.matchMedia(MOBILE_MEDIA_QUERY); } catch { return undefined; }
        const handler = (e) => setIsMobile(e.matches);
        setIsMobile(mq.matches);
        mq.addEventListener?.('change', handler);
        return () => mq.removeEventListener?.('change', handler);
    }, []);

    return isMobile;
};
