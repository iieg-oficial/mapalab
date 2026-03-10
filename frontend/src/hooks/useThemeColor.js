import { useEffect } from 'react';

const useThemeColor = (color) => {
    useEffect(() => {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = color;
        return () => { if (meta) meta.content = '#5C2472'; };
    }, [color]);
};

export default useThemeColor;
