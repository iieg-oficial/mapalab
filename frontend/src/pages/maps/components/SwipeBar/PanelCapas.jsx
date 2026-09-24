import { useMemo } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useActiveLayersLogic } from '@hooksMaps/useActiveLayersLogic';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { computeLabel } from '@mapsComponents/ActiveLayers/datePillHelpers';
import DatePill from '@mapsComponents/ActiveLayers/DatePill';
import { SLOT_COLORS, slotLabel } from '@pages/maps/helpers/swipeTheme';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { RADIUS_ICON } from '@pages/maps/helpers/periodicityTones';

const BotonLado = ({ slot, activo, bloqueado, onClick, onResaltar }) => (
    <Tooltip content={bloqueado ? 'Debe quedar en al menos un lado' : `${activo ? 'Quitar del' : 'Mostrar en el'} lado ${slotLabel(slot)}`}>
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (!bloqueado) onClick(); }}
            onMouseEnter={() => onResaltar?.(slot)}
            onMouseLeave={() => onResaltar?.(null)}
            aria-pressed={activo}
            aria-disabled={bloqueado}
            aria-label={`${activo ? 'Quitar del' : 'Mostrar en el'} lado ${slotLabel(slot)}`}
            style={activo ? { backgroundColor: SLOT_COLORS[slot].fg } : undefined}
            className={`size-7 shrink-0 rounded-full flex items-center justify-center font-garet font-bold text-[12px] transition-colors ${activo
                ? 'text-white'
                : 'bg-[#EFF3FC] text-[#9AA3A8] hover:text-[#465055]'} ${bloqueado ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
            {slotLabel(slot)}
        </button>
    </Tooltip>
);

const PanelCapas = ({ onClose, onElegirFecha }) => {
    const {
        compareMode, allLayers, selectedLayerForSymbology,
        setSelectedLayerForSymbology, setLayerSlotMembership, highlightSlots,
    } = useMapsContext();

    const idsUnion = useMemo(() => {
        const enA = compareMode?.paneA?.activeLayerIds || [];
        const enB = compareMode?.paneB?.activeLayerIds || [];
        const orden = compareMode?.globalOrder || [];
        const posicion = (id) => {
            const i = orden.indexOf(id);
            return i === -1 ? Number.MAX_SAFE_INTEGER : i;
        };
        return [...new Set([...enA, ...enB])].sort((a, b) => posicion(a) - posicion(b));
    }, [compareMode?.paneA?.activeLayerIds, compareMode?.paneB?.activeLayerIds, compareMode?.globalOrder]);

    const { unifiedLayers } = useActiveLayersLogic(idsUnion, []);

    const capas = useMemo(() => unifiedLayers.map((capa) => {
        const rasterPeriodicity = findLayerDef(capa.id, allLayers)?.rasterPeriodicity || null;
        const etiqueta = (slot) => computeLabel(
            compareMode?.[`pane${slot}`]?.filters?.[capa.id]?.date,
            rasterPeriodicity,
        );
        return {
            id: capa.id,
            name: capa.name,
            enA: !!compareMode?.paneA?.activeLayerIds?.includes(capa.id),
            enB: !!compareMode?.paneB?.activeLayerIds?.includes(capa.id),
            fechaA: etiqueta('A'),
            fechaB: etiqueta('B'),
        };
    }), [unifiedLayers, compareMode, allLayers]);

    if (!capas.length) return null;

    const alternarLado = (capa, slot) => {
        const otro = slot === 'A' ? 'B' : 'A';
        const estaAqui = slot === 'A' ? capa.enA : capa.enB;
        const estaAlla = slot === 'A' ? capa.enB : capa.enA;
        if (estaAqui && !estaAlla) return;
        setLayerSlotMembership?.(capa.id, estaAqui ? otro : 'AB');
    };

    const celdaFecha = (capa, slot) => {
        const dentro = slot === 'A' ? capa.enA : capa.enB;
        const etiqueta = slot === 'A' ? capa.fechaA : capa.fechaB;
        if (!dentro || !etiqueta.label) return null;
        return (
            <span onMouseEnter={() => highlightSlots?.(slot)} onMouseLeave={() => highlightSlots?.(null)}>
                <DatePill
                    slot={slot}
                    label={etiqueta.label}
                    kind={etiqueta.kind}
                    onClick={(e) => { e.stopPropagation(); onElegirFecha?.(capa, slot); }}
                    size="sm"
                    autoWidth
                />
            </span>
        );
    };

    return (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-[min(460px,calc(100vw-2rem))] max-h-[60vh] overflow-y-auto px-4.5 pt-2 pb-4.5 rounded-[10px] bg-[#F9FBFF] shadow-[0_5px_20px_#1A26641A]">
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <Icon name="tool_swipe" className="size-8 text-purple" />
                    <h3 className="font-garet font-bold text-[18px]/[47px]">Capas comparadas</h3>
                </div>
                <MobileSheetCloseButton onClick={onClose} />
            </div>

            <div className="flex flex-col gap-1">
                {capas.map((capa) => {
                    const elegida = capa.id === selectedLayerForSymbology?.id;
                    const solaEnA = capa.enA && !capa.enB;
                    const solaEnB = capa.enB && !capa.enA;
                    return (
                        <div
                            key={capa.id}
                            className={`flex items-center gap-2 min-h-[50px] px-2 py-2 rounded-[7px] border border-transparent transition-all hover:border-[#EAEFFA] hover:shadow-sm ${elegida
                                ? 'bg-[#F7F0FA] ring-1 ring-[#70308A]'
                                : 'bg-white'}`}
                        >
                            <BotonLado slot="A" activo={capa.enA} bloqueado={solaEnA} onClick={() => alternarLado(capa, 'A')} onResaltar={highlightSlots} />

                            {celdaFecha(capa, 'A')}

                            <Tooltip content={capa.name} placement="top" delay={400} triggerClassName="flex-1 min-w-0">
                                <button
                                    type="button"
                                    onClick={() => { setSelectedLayerForSymbology?.({ id: capa.id, name: capa.name }); onClose?.(); }}
                                    aria-pressed={elegida}
                                    aria-label={`Comparar ${capa.name}`}
                                    className="w-full text-center font-garet font-medium text-[14px]/[17px] text-[#465055] line-clamp-2 cursor-pointer hover:text-[#70308A] transition-colors"
                                >
                                    {capa.name}
                                </button>
                            </Tooltip>

                            {celdaFecha(capa, 'B')}

                            <BotonLado slot="B" activo={capa.enB} bloqueado={solaEnB} onClick={() => alternarLado(capa, 'B')} onResaltar={highlightSlots} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PanelCapas;
