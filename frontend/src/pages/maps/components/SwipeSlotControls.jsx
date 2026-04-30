import { useEffect, useMemo, useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useSider } from '@contexts/SiderContext';
import Tooltip from '@components/Tooltip';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import DatePill from './ActiveLayers/DatePill';
import { computeLabel } from './ActiveLayers/datePillHelpers';

const ActionsHint = ({ visible }) => (
    <div
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 -top-14 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
        <div className="bg-[#FFF1E3] border-2 border-[#FF8300] text-[#FF8300] py-2 px-5 rounded-full font-garet font-bold text-[12px] whitespace-nowrap shadow-[0_5px_20px_#1A26641A]">
            Barra de acciones
            <div
                className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0"
                style={{
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderTop: '7px solid #FF8300',
                }}
            />
        </div>
    </div>
);

const SwipeSlotControls = () => {
    const {
        compareMode, exitCompareMode, toggleSwipeOrientation,
        selectedLayerForSymbology, allLayers, dateLoops, setSelectedLayer,
    } = useMapsContext();
    const { width: siderWidth, isOpen: isSiderOpen, isMobile: isMobileSider } = useSider();
    const siderShift = !isMobileSider && isSiderOpen ? siderWidth / 2 : 0;
    const [hintPhase, setHintPhase] = useState(isMobileSider ? 'hidden' : 'visible');

    useEffect(() => {
        if (isMobileSider) return;
        const t1 = setTimeout(() => setHintPhase('fading'), 500);
        const t2 = setTimeout(() => setHintPhase('hidden'), 1000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [isMobileSider]);

    const layerId = selectedLayerForSymbology?.id || null;
    const layerDef = useMemo(() => (layerId ? findLayerDef(layerId, allLayers) : null), [layerId, allLayers]);
    const rasterPeriodicity = layerDef?.rasterPeriodicity || null;

    const inA = !!(layerId && compareMode?.paneA?.activeLayerIds?.includes(layerId));
    const inB = !!(layerId && compareMode?.paneB?.activeLayerIds?.includes(layerId));
    const filterA = compareMode?.paneA?.filters?.[layerId]?.date;
    const filterB = compareMode?.paneB?.filters?.[layerId]?.date;
    const labelA = useMemo(() => computeLabel(filterA, rasterPeriodicity), [filterA, rasterPeriodicity]);
    const labelB = useMemo(() => computeLabel(filterB, rasterPeriodicity), [filterB, rasterPeriodicity]);
    const isLooping = !!(layerId && dateLoops?.[layerId]?.isPlaying);
    const isLoopingA = isLooping && compareMode?.activeSlot === 'A';
    const isLoopingB = isLooping && compareMode?.activeSlot === 'B';

    if (!compareMode?.active) return null;
    const isHorizontal = compareMode.swipeOrientation === 'horizontal';

    const handlePillClick = () => {
        if (selectedLayerForSymbology) setSelectedLayer?.(selectedLayerForSymbology);
    };

    const showA = inA && labelA.label;
    const showB = inB && labelB.label;

    return (
        <div
            className={`fixed z-20 flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-[0_5px_20px_#1A26641A] border border-gray-200 ${isMobileSider ? 'bottom-16' : 'bottom-4'}`}
            style={{ left: `calc(50% + ${siderShift}px)`, transform: 'translateX(-50%)' }}
        >
            {!isMobileSider && hintPhase !== 'hidden' && (
                <ActionsHint visible={hintPhase === 'visible'} />
            )}
            {showA && (
                <DatePill slot="A" label={labelA.label} kind={labelA.kind} onClick={handlePillClick} isLooping={isLoopingA} size="md" />
            )}

            <Tooltip content={isHorizontal ? 'Cambiar a barra vertical' : 'Cambiar a barra horizontal'} placement="bottom" delay={300}>
                <button
                    type="button"
                    onClick={toggleSwipeOrientation}
                    className="size-10 flex items-center justify-center rounded-full bg-[#EAEFFA] text-[#703089] hover:bg-[#703089] hover:text-white transition-all cursor-pointer"
                    aria-label={isHorizontal ? 'Cambiar a barra vertical' : 'Cambiar a barra horizontal'}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 transition-transform ${isHorizontal ? '' : 'rotate-90'}`}>
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <polyline points="7 8 3 12 7 16" />
                        <polyline points="17 8 21 12 17 16" />
                    </svg>
                </button>
            </Tooltip>

            <Tooltip content="Cerrar y volver al estado original" placement="bottom" delay={300}>
                <button
                    type="button"
                    onClick={exitCompareMode}
                    className="size-10 flex items-center justify-center rounded-full border border-transparent text-[#465055] hover:border-[#465055] active:bg-[#465055] active:text-white transition-all cursor-pointer"
                    aria-label="Cerrar comparador"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </Tooltip>

            {showB && (
                <DatePill slot="B" label={labelB.label} kind={labelB.kind} onClick={handlePillClick} isLooping={isLoopingB} size="md" />
            )}
        </div>
    );
};

export default SwipeSlotControls;
