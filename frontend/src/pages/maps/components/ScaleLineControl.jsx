import { useCallback, useRef } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useAreaUtil } from '@contexts/AreaUtilContext';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import { useScaleLineControl } from '@hooksMaps/useScaleLineControl';
import { useDron } from '@contexts/DronContext';

const ScaleLineControl = () => {
    const { mapRef, compareMode, paneMapInstances } = useMapsContext();
    const { style, className } = useSiderAdaptivePosition({ bottomOffset: 40 });
    const { margenes } = useAreaUtil();
    const containerRef = useRef(null);
    const isSwipe = !!compareMode?.active;
    const { activo: enDron } = useDron();

    const getMapInstance = useCallback(() => {
        if (isSwipe) return paneMapInstances?.[0] ?? null;
        return mapRef?.current ?? null;
    }, [isSwipe, mapRef, paneMapInstances]);

    useScaleLineControl(getMapInstance, containerRef);

    return (
        <div
            ref={containerRef}
            className={`fixed bottom-1 z-10 ${className} ${enDron ? 'hidden' : ''}`}
            style={{
                ...style,
                left: `calc(${style?.left || '0px'} + ${margenes.left}px)`,
                bottom: `calc(0.25rem + ${margenes.bottom}px)`,
            }}
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
