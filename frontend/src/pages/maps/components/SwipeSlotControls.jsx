import { useEffect, useMemo, useRef, useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useSider } from '@contexts/SiderContext';
import { useOutsideClick } from '@hooks/useOutsideClick';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import CloseButton from '@components/CloseButton';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import DatePill from './ActiveLayers/DatePill';
import { computeLabel } from './ActiveLayers/datePillHelpers';
import PanelPeriodicidad from './SwipeBar/PanelPeriodicidad';
import PanelCapas from './SwipeBar/PanelCapas';

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

const ListaIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M9 6.5h11M9 12h11M9 17.5h11" />
        <circle cx="4.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="17.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
);

const BOTON_BARRA = 'size-10 flex items-center justify-center rounded-full transition-all cursor-pointer shrink-0';

const SwipeSlotControls = () => {
    const {
        compareMode, exitCompareMode, toggleSwipeOrientation,
        selectedLayerForSymbology, setSelectedLayerForSymbology, allLayers, dateLoops,
    } = useMapsContext();
    const { width: siderWidth, isOpen: isSiderOpen, isMobile: isMobileSider } = useSider();
    const siderShift = !isMobileSider && isSiderOpen ? siderWidth / 2 : 0;
    const [hintPhase, setHintPhase] = useState(isMobileSider ? 'hidden' : 'visible');
    const [abierto, setAbierto] = useState(null);
    const containerRef = useRef(null);
    const objetivoRef = useRef(null);

    useOutsideClick([containerRef], () => setAbierto(null));

    useEffect(() => {
        if (isMobileSider) return;
        const t1 = setTimeout(() => setHintPhase('fading'), 500);
        const t2 = setTimeout(() => setHintPhase('hidden'), 1000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [isMobileSider]);

    const layerId = selectedLayerForSymbology?.id || null;
    const layerName = selectedLayerForSymbology?.name || selectedLayerForSymbology?.label || '';
    const layerDef = useMemo(() => (layerId ? findLayerDef(layerId, allLayers) : null), [layerId, allLayers]);
    const rasterPeriodicity = layerDef?.rasterPeriodicity || null;

    useEffect(() => {
        if (objetivoRef.current) {
            setAbierto(objetivoRef.current);
            objetivoRef.current = null;
            return;
        }
        setAbierto(null);
    }, [layerId]);

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

    const alternar = (destino) => setAbierto(previo => (previo === destino ? null : destino));
    const cerrar = () => setAbierto(null);

    const elegirFecha = (capa, slot) => {
        if (capa.id === layerId) {
            setAbierto(slot);
            return;
        }
        objetivoRef.current = slot;
        setSelectedLayerForSymbology?.({ id: capa.id, name: capa.name });
    };

    const showA = inA && labelA.label;
    const showB = inB && labelB.label;

    return (
        <div
            ref={containerRef}
            className={`fixed z-20 flex items-center gap-2 ${isMobileSider ? 'bottom-16' : 'bottom-4'}`}
            style={{ left: `calc(50% + ${siderShift}px)`, transform: 'translateX(-50%)' }}
        >
            <div className="relative flex items-center justify-between gap-2 px-3 py-2 min-w-[520px] max-md:min-w-0 bg-white rounded-full shadow-[0_5px_20px_#1A26641A] border border-gray-200">
                {!isMobileSider && hintPhase !== 'hidden' && (
                    <ActionsHint visible={hintPhase === 'visible'} />
                )}

                {abierto === 'A' && <PanelPeriodicidad layerId={layerId} slot="A" onClose={cerrar} />}
                {abierto === 'B' && <PanelPeriodicidad layerId={layerId} slot="B" onClose={cerrar} />}
                {abierto === 'capas' && <PanelCapas onClose={cerrar} onElegirFecha={elegirFecha} />}

                {showA && (
                    <div className="relative z-[1]">
                        <DatePill slot="A" label={labelA.label} kind={labelA.kind} onClick={() => alternar('A')} isLooping={isLoopingA} size="md" autoWidth />
                    </div>
                )}

                <div className="relative z-[1] flex items-center gap-2 min-w-0">
                    {layerName && (
                        <span className="min-w-0 h-8 px-3 flex items-center font-garet font-medium text-[14px] text-[#465055]">
                            <span className="truncate max-w-[220px] max-md:max-w-[110px]">{layerName}</span>
                        </span>
                    )}

                    <Tooltip content={abierto === 'capas' ? 'Cerrar las capas comparadas' : 'Ver las capas comparadas'} placement="bottom" delay={300}>
                        <button
                            type="button"
                            onClick={() => alternar('capas')}
                            aria-expanded={abierto === 'capas'}
                            aria-label="Ver las capas comparadas"
                            className={`${BOTON_BARRA} ${abierto === 'capas'
                                ? 'bg-[#703089] text-white'
                                : 'bg-[#EAEFFA] text-[#703089] hover:bg-[#703089] hover:text-white'}`}
                        >
                            <ListaIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>

                    <Tooltip content={isHorizontal ? 'Cambiar a barra vertical' : 'Cambiar a barra horizontal'} placement="bottom" delay={300}>
                        <button
                            type="button"
                            onClick={toggleSwipeOrientation}
                            className={`${BOTON_BARRA} bg-[#EAEFFA] text-[#703089] hover:bg-[#703089] hover:text-white`}
                            aria-label={isHorizontal ? 'Cambiar a barra vertical' : 'Cambiar a barra horizontal'}
                        >
                            <Icon name="swipe_orientacion" className={`w-5 h-5 transition-transform ${isHorizontal ? '' : 'rotate-90'}`} />
                        </button>
                    </Tooltip>
                </div>

                {showB && (
                    <div className="relative z-[1]">
                        <DatePill slot="B" label={labelB.label} kind={labelB.kind} onClick={() => alternar('B')} isLooping={isLoopingB} size="md" autoWidth />
                    </div>
                )}
            </div>

            <CloseButton
                onConfirm={exitCompareMode}
                tooltip="Cerrar comparador"
                tooltipPlacement="top"
                confirmTitle="¿Cerrar la comparación?"
                confirmDescription="Se descartará la comparación actual y volverás al estado original del mapa."
                confirmText="Sí, cerrar comparador"
                confirmPlacement="top"
                confirmClassName="left-1/2 -translate-x-1/2"
                size="size-10"
                iconSize="size-8"
                tone="herramienta"
            />
        </div>
    );
};

export default SwipeSlotControls;
