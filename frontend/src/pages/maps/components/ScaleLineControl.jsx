import { useCallback, useRef } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import { useScaleLineControl } from '@hooksMaps/useScaleLineControl';

const ScaleLineControl = () => {
    const { mapRef, compareMode, paneMapRefs } = useMapsContext();
    const { style, className } = useSiderAdaptivePosition({ bottomOffset: 40 });
    const containerRef = useRef(null);
    const isSwipe = !!compareMode?.active;

    const getMapInstance = useCallback(() => {
        if (isSwipe) return paneMapRefs?.current?.[0]?.current ?? null;
        return mapRef?.current ?? null;
    }, [isSwipe, mapRef, paneMapRefs]);

    useScaleLineControl(getMapInstance, containerRef);

    return (
        <div
            ref={containerRef}
            className={`fixed bottom-1 z-10 ${className}`}
            style={style}
        >
            <style>{`
                .ol-scale-line {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(4px);
                    padding: 4px 8px;
                    border-radius: 0.75rem;
                    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
                    font-size: 10px;
                    line-height: 1;
                }

                .ol-scale-line-inner {
                    border: 1px solid rgb(39, 39, 42);
                    border-top: none;
                    color: rgb(39, 39, 42);
                    font-size: 10px;
                    text-align: center;
                    margin: 1px;
                    will-change: contents, width;
                }
            `}</style>
        </div>
    );
};

export default ScaleLineControl;
