import { useMemo } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useActiveLayersLogic } from '@hooksMaps/useActiveLayersLogic';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { computeLabel } from '@mapsComponents/ActiveLayers/datePillHelpers';
import DatePill from '@mapsComponents/ActiveLayers/DatePill';
import { SLOT_COLORS } from '@pages/maps/helpers/swipeTheme';
import Checkbox from '@components/Checkbox';
import Tooltip from '@components/Tooltip';
import { RADIUS_ICON } from '@pages/maps/helpers/periodicityTones';

const SIN_FECHA = '—';

const PanelCapas = ({ onClose, onElegirFecha }) => {
    const {
        compareMode, allLayers, selectedLayerForSymbology,
        setSelectedLayerForSymbology, setLayerSlotMembership,
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
        return (
            <div className={`w-[74px] shrink-0 flex ${slot === 'A' ? 'justify-end' : 'justify-start'}`}>
                {dentro && etiqueta.label ? (
                    <DatePill
                        slot={slot}
                        label={etiqueta.label}
                        kind={etiqueta.kind}
                        onClick={(e) => { e.stopPropagation(); onElegirFecha?.(capa, slot); }}
                        size="sm"
                        autoWidth
                    />
                ) : (
                    <span className="font-garet text-[11px]/[14px] text-[#C4CACE]">{dentro ? SIN_FECHA : ''}</span>
                )}
            </div>
        );
    };

    return (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-[min(460px,calc(100vw-2rem))] max-h-[60vh] overflow-y-auto bg-white rounded-xl shadow-[0_5px_20px_#1A26641A]">
            <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                <span className="flex-1 font-garet font-bold text-[15px]/[18px] text-purple">Capas comparadas</span>
                <Tooltip content="Cerrar el panel de capas" placement="bottom" delay={200}>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar el panel de capas"
                        className={`size-7 shrink-0 ${RADIUS_ICON} text-[#6E7477] hover:text-purple hover:bg-purple-soft flex items-center justify-center transition-colors cursor-pointer`}
                    >
                        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </Tooltip>
            </div>

            <div className="flex flex-col gap-1 px-2.5 pb-3">
                {capas.map((capa) => {
                    const elegida = capa.id === selectedLayerForSymbology?.id;
                    const solaEnA = capa.enA && !capa.enB;
                    const solaEnB = capa.enB && !capa.enA;
                    return (
                        <div
                            key={capa.id}
                            className={`flex items-center px-2.5 py-2 rounded-xl border transition-colors ${elegida ? 'border-purple bg-purple-soft' : 'border-[#EDEFF1] hover:border-purple'}`}
                        >
                            <Tooltip content={solaEnA ? 'Debe quedar en al menos un lado' : `${capa.enA ? 'Quitar del' : 'Mostrar en el'} lado A`}>
                                <Checkbox
                                    checked={capa.enA}
                                    disabled={solaEnA}
                                    color={SLOT_COLORS.A.fg}
                                    onChange={() => alternarLado(capa, 'A')}
                                />
                            </Tooltip>

                            {celdaFecha(capa, 'A')}

                            <button
                                type="button"
                                onClick={() => { setSelectedLayerForSymbology?.({ id: capa.id, name: capa.name }); onClose?.(); }}
                                aria-pressed={elegida}
                                aria-label={`Comparar ${capa.name}`}
                                className="flex-1 min-w-0 px-2 text-center font-garet font-bold text-[13px]/[16px] text-[#1F2328] truncate cursor-pointer hover:text-purple transition-colors"
                            >
                                {capa.name}
                            </button>

                            {celdaFecha(capa, 'B')}

                            <Tooltip content={solaEnB ? 'Debe quedar en al menos un lado' : `${capa.enB ? 'Quitar del' : 'Mostrar en el'} lado B`}>
                                <Checkbox
                                    checked={capa.enB}
                                    disabled={solaEnB}
                                    color={SLOT_COLORS.B.fg}
                                    onChange={() => alternarLado(capa, 'B')}
                                    className="ml-2"
                                />
                            </Tooltip>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PanelCapas;
