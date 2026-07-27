import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ScrollContainer from '@components/ScrollContainer';
import MobileSheet, { MobileSheetCloseButton } from '@components/MobileSheet';
import LicenseTooltipContent from '@components/LicenseTooltipContent';
import { useIsMobile } from '@hooks/useIsMobile';
import { renderCard } from '@pages/maps/components/InfoBox/utils/renderCard.jsx';
import { downloadFeaturesAsCSV } from '@pages/maps/components/InfoBox/utils/downloadFeatures';
import InfoBoxArrow, { ARROW_TIP } from '@pages/maps/components/InfoBox/components/InfoBoxArrow';
import ActionsToolbar from '@pages/maps/components/InfoBox/components/ActionsToolbar';
import DismissGesture from '@pages/maps/components/InfoBox/components/DismissGesture';
import InfoBoxTools from '@pages/maps/components/InfoBox/components/InfoBoxTools';
import { useViewportContainment } from '@pages/maps/components/InfoBox/hooks/useViewportContainment';
import { useDraggablePanel } from '@pages/maps/components/InfoBox/hooks/useDraggablePanel';
import { centerOnResults } from '@pages/maps/helpers/featureGeometry';
import { trackCatalogoInfoBoxAction } from '@services/analyticsService';

const featureKey = (feature, idx) => feature?.id ?? `feature-${idx}`;

const CatalogoInfoBox = ({ capa, features, pixel, lngLat, mapInstance, onReposition, onEdit, onClose }) => {
    const isMobile = useIsMobile();
    const panelRef = useRef(null);
    const cardRef = useRef(null);
    const [dismissed, setDismissed] = useState(() => new Set());

    useEffect(() => {
        setDismissed(new Set());
    }, [features]);

    const visibles = useMemo(
        () => (features || []).filter((f, idx) => !dismissed.has(featureKey(f, idx))),
        [features, dismissed],
    );

    const layerId = capa?.geoserverLayer || capa?.slug || null;

    const results = useMemo(() => [{
        layerId,
        layerName: capa?.nombre,
        features: visibles,
        littleCard: capa?.littleCard || null,
    }], [layerId, capa, visibles]);

    const total = visibles.length;
    const isSingle = total === 1;

    const baseTransform = isSingle ? 'translate(-50%, -100%)' : '';
    const { isDragging, handleProps: moveHandleProps, reset: resetDrag } = useDraggablePanel({ panelRef, baseTransform });

    useViewportContainment(panelRef, [features, pixel, isMobile], 10, isDragging);

    useEffect(() => {
        resetDrag();
    }, [lngLat?.lng, lngLat?.lat, resetDrag]);

    const handleRemove = useCallback((feature, idx) => {
        setDismissed((prev) => {
            const next = new Set(prev);
            next.add(featureKey(feature, idx));
            return next;
        });
    }, []);

    useEffect(() => {
        if (features?.length && visibles.length === 0) onClose();
    }, [features, visibles.length, onClose]);

    const handleDownload = useCallback(() => {
        trackCatalogoInfoBoxAction({ action: 'download', slug: capa?.slug || null });
        downloadFeaturesAsCSV(results);
    }, [results, capa]);

    const handleCenter = useCallback(() => {
        const clickPosition = onReposition ? { updatePosition: ({ pixel: p }) => onReposition(p) } : null;
        if (centerOnResults({ activeMap: mapInstance, results, clickPosition })) {
            trackCatalogoInfoBoxAction({ action: 'center_group', slug: capa?.slug || null });
        }
    }, [mapInstance, results, onReposition, capa]);

    const cards = useMemo(() => visibles.map((feature, idx) => ({
        key: featureKey(feature, idx),
        feature,
        idx,
        node: renderCard(
            feature.properties,
            capa?.littleCard || null,
            () => handleRemove(feature, idx),
            layerId,
            feature.id,
            null,
            isMobile ? 'mobile' : 'desktop',
            idx + 1,
            visibles.length,
            null,
        ),
    })).filter((c) => c.node), [visibles, capa, layerId, isMobile, handleRemove]);

    if (cards.length === 0 || (!pixel && !isMobile)) return null;

    const lista = (
        <div className="space-y-2">
            {cards.map(({ key, feature, idx, node }) => (isMobile ? (
                <DismissGesture key={key} onRemove={() => handleRemove(feature, idx)}>
                    {node}
                </DismissGesture>
            ) : (
                <div key={key}>{node}</div>
            )))}
        </div>
    );

    if (isMobile) {
        const tools = [
            { id: 'center_group', icon: 'center_group', label: 'Centrar selección', tooltip: 'Centrar selección en el mapa', onClick: handleCenter },
            onEdit && { id: 'edit', icon: 'pencil', label: 'Personalizar tarjeta', tooltip: 'Elegir qué datos aparecen', onClick: () => onEdit(visibles[0] || null) },
            total > 1 && { id: 'download', icon: 'download', label: <>Descargar <span className="text-orange font-bold">{total}</span> {total === 1 ? 'tarjeta' : 'tarjetas'}</>, tooltip: <LicenseTooltipContent />, onClick: handleDownload },
        ];

        return (
            <MobileSheet open onClose={onClose}>
                <div className="px-4 pt-3 pb-1 flex items-center gap-2 shrink-0">
                    <h3 className="font-garet font-bold text-[13px]/[16px] text-[#2E4372]">Información</h3>
                    <MobileSheetCloseButton onClick={onClose} />
                </div>
                <div className="flex items-center pl-[13px] pr-4 pb-2 gap-3">
                    <InfoBoxTools tools={tools} layerId={layerId} />
                </div>
                <ScrollContainer
                    className="flex-1 px-3 pb-3"
                    overlayFade
                    overlayColor="#F9FBFF"
                    clickableArrows
                    minItemsForClick={3}
                    itemCount={total}
                >
                    {lista}
                </ScrollContainer>
            </MobileSheet>
        );
    }

    const positionStyle = {
        position: 'fixed',
        left: `${pixel[0] + (isSingle ? 0 : ARROW_TIP)}px`,
        top: `${pixel[1] + (isSingle ? -ARROW_TIP : -24)}px`,
    };

    return (
        <>
            <div
                ref={panelRef}
                className={`relative bg-transparent z-30 ${isSingle ? '' : 'flex items-stretch gap-2'}`}
                style={positionStyle}
            >
                <div ref={cardRef} className="relative w-[239px]">
                    {isSingle ? lista : (
                        <ScrollContainer
                            className="max-h-[60vh] rounded-lg"
                            overlayFade
                            overlayColor="#F9FBFF"
                            clickableArrows
                            minItemsForClick={3}
                            itemCount={total}
                        >
                            {lista}
                        </ScrollContainer>
                    )}
                </div>

                <div className={isSingle
                    ? 'absolute left-full top-0 ml-2 flex flex-col items-center'
                    : 'flex flex-col items-center justify-between pb-1'}
                >
                    <ActionsToolbar
                        onClear={total > 1 ? onClose : null}
                        moveHandleProps={moveHandleProps}
                        isMoving={isDragging}
                        onDownload={total > 1 ? handleDownload : null}
                        onCenter={handleCenter}
                        onEdit={onEdit ? () => onEdit(visibles[0] || null) : null}
                        downloadCount={total}
                        downloadTooltip={<LicenseTooltipContent />}
                    />
                </div>
            </div>

            <InfoBoxArrow panelRef={cardRef} mapInstance={mapInstance} lngLat={lngLat} zIndex={29} />
        </>
    );
};

export default CatalogoInfoBox;
