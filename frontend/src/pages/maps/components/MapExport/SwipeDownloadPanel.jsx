import { useMemo, useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import Checkbox from '@components/Checkbox';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { computeLabel } from '../ActiveLayers/datePillHelpers';

const SwipeDownloadPanel = ({ onDownload, isDownloading, defaultTitle = 'Mapa swipe' }) => {
    const { compareMode, selectedLayerForSymbology, allLayers } = useMapsContext();
    const [showBar, setShowBar] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [showPills, setShowPills] = useState(true);
    const [title, setTitle] = useState(defaultTitle);

    const layerId = selectedLayerForSymbology?.id || null;
    const layerDef = useMemo(() => (layerId ? findLayerDef(layerId, allLayers) : null), [layerId, allLayers]);
    const rasterPeriodicity = layerDef?.rasterPeriodicity || null;
    const filterA = compareMode?.paneA?.filters?.[layerId]?.date;
    const filterB = compareMode?.paneB?.filters?.[layerId]?.date;
    const labelA = useMemo(() => computeLabel(filterA, rasterPeriodicity), [filterA, rasterPeriodicity]);
    const labelB = useMemo(() => computeLabel(filterB, rasterPeriodicity), [filterB, rasterPeriodicity]);
    const inA = !!(layerId && compareMode?.paneA?.activeLayerIds?.includes(layerId));
    const inB = !!(layerId && compareMode?.paneB?.activeLayerIds?.includes(layerId));
    const pills = [];
    if (inA && labelA.label) pills.push({ slot: 'A', label: labelA.label });
    if (inB && labelB.label) pills.push({ slot: 'B', label: labelB.label });
    const canShowPills = pills.length > 0;

    const handleDownload = () => {
        onDownload?.({ showBar, showLabels, showPills: showPills && canShowPills, pills, title });
    };

    return (
        <div className="flex flex-col px-4 pb-4 gap-4">
            <p className="text-xs text-gray-600">
                El comparador se exportara como PNG con el corte y los lados visibles.
            </p>

            <label className="block">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                    Titulo
                </span>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-garet"
                />
            </label>

            <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <Checkbox checked={showBar} onChange={() => setShowBar(p => !p)} />
                    Mostrar barra divisora
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <Checkbox checked={showLabels} onChange={() => setShowLabels(p => !p)} />
                    Mostrar etiquetas A / B
                </label>
                <label className={`flex items-center gap-2 text-sm ${canShowPills ? 'cursor-pointer text-gray-700' : 'cursor-not-allowed text-gray-400'}`}>
                    <Checkbox checked={showPills && canShowPills} onChange={() => canShowPills && setShowPills(p => !p)} disabled={!canShowPills} />
                    Mostrar fechas de la capa seleccionada
                </label>
                {!canShowPills && (
                    <span className="text-[10px] text-gray-500 -mt-1 ml-6">
                        Selecciona una capa con periodicidad para incluir las fechas.
                    </span>
                )}
            </div>

            <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full h-12.5 bg-[#703089] text-white rounded-[30px] hover:bg-[#5C2472] hover:shadow-[0_6px_6px_#5C247234] transition font-garet font-bold text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isDownloading ? 'Generando…' : 'Descargar PNG'}
            </button>
        </div>
    );
};

export default SwipeDownloadPanel;
