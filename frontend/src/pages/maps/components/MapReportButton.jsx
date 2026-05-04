import { useCallback } from 'react';
import ReportButton from '@components/ReportButton';
import { useMapsContext } from '@hooks/useMaps';
import { useMapCapture } from './MapExport/hooks/useMapCapture';

const MapReportButton = ({ variant = 'floating', extraContext, label, className }) => {
    const { targetRef, compareMode } = useMapsContext();
    const { captureElement } = useMapCapture();
    const isSwipe = !!compareMode?.active;

    const captureFn = useCallback(async () => {
        const target = isSwipe
            ? document.querySelector('[data-swipe-composite="true"]')
            : targetRef?.current;
        if (!target) return null;
        return captureElement(target, { scale: 0.7 });
    }, [captureElement, isSwipe, targetRef]);

    return (
        <ReportButton
            variant={variant}
            extraContext={extraContext}
            captureFn={captureFn}
            label={label}
            className={className}
        />
    );
};

export default MapReportButton;
