import { useContext, useState, useEffect, useRef } from 'react';
import { isParentLayer } from '../helpers/symbologyHelpers';
import { MOBILE_BREAKPOINT } from '@constants/sider';
import MapsContext from '@contexts/MapsContext';
import SymbologyItem from './SymbologyItem';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import Switch from '@components/Switch';

import { useZenMode } from './ZenMode';

const SymbologyPanel = ({ onCollapseChange }) => {
    const { selectedLayerForSymbology, findLayerById, getLayersForSymbology, compareMode, setActiveSlot } = useContext(MapsContext);
    const isComparing = !!compareMode?.active;
    const activeSlot = compareMode?.activeSlot;
    const [isManuallyCollapsed, setIsManuallyCollapsed] = useState(true);
    const { isZenMode } = useZenMode();

    useEffect(() => {
        if (isZenMode) {
            setIsManuallyCollapsed(true);
        }
    }, [isZenMode]);

    const hasLayer = !!selectedLayerForSymbology;
    const isCollapsed = isManuallyCollapsed || !hasLayer;

    useEffect(() => { onCollapseChange?.(isCollapsed); }, [isCollapsed, onCollapseChange]);

    const prevSelectedIdRef = useRef(selectedLayerForSymbology?.id);

    useEffect(() => {
        const currentId = selectedLayerForSymbology?.id;
        const prevId = prevSelectedIdRef.current;

        if (prevId && currentId && prevId !== currentId) {
            setIsManuallyCollapsed(false);
        }

        prevSelectedIdRef.current = currentId;
    }, [selectedLayerForSymbology]);

    const handleManualCollapse = () => {
        setIsManuallyCollapsed(true);
    };

    const handleExpand = () => {
        setIsManuallyCollapsed(false);
    };

    if (isCollapsed) {
        return (
            <div className="w-auto flex items-center justify-end">
                <Tooltip content={hasLayer ? 'Expandir Panel de Simbología' : 'Selecciona una capa para ver sus simbologías'} placement="left">
                    <button
                        onClick={handleExpand}
                        className="size-12.5 flex items-center justify-center bg-[#EAEFFA] rounded-full transition-colors hover:bg-[#F2EBFF] hover:border-[#5C2472] hover:border cursor-pointer max-md:pointer-events-auto"
                    >
                        <Icon name="simbologia" className="size-10" />
                    </button>
                </Tooltip>
            </div>
        );
    }

    if (!hasLayer) {
        return null;
    }

    const fullLayer = findLayerById(selectedLayerForSymbology.id) || selectedLayerForSymbology;
    const displayLayers = getLayersForSymbology(fullLayer);

    return (
        <div className="w-auto px-4.5 pb-2 pt-2 rounded-[10px] bg-[#F9FBFF] shadow-[0_5px_20px_#1A26641A] shrink-0 max-md:pointer-events-auto">
            <div className="flex justify-between items-center mb-2 shrink-0">
                <div className="flex items-center gap-3">
                    <Icon name="simbologia" className="size-8" />
                    <h3 className="font-garet font-bold text-[18px]/[47px]">Simbología</h3>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={handleManualCollapse} className="cursor-pointer">
                        <Tooltip content="Colapsar simbologías"><Icon name="zoomout" className="size-6" /></Tooltip>
                    </button>
                </div>
            </div>

            {isComparing && (
                <div className="flex items-center gap-2 mb-2 px-1 text-[11px] font-garet text-[#465055]">
                    <span>Leyenda de</span>
                    <Switch
                        checked={activeSlot === 'A'}
                        onChange={(next) => setActiveSlot(next ? 'A' : 'B')}
                        onLabel="A"
                        offLabel="B"
                        onColor="#5C2472"
                        offColor="#FF8300"
                        tooltip={`Mostrando leyenda de ${activeSlot}`}
                    />
                </div>
            )}

            <div className="rounded-[7px] bg-white px-3.5 py-3">
                {displayLayers.length === 0 ? (
                    <div className="rounded-[7px] py-2">
                        {isParentLayer(fullLayer) ? 'No hay sub-capas activas' : 'Sin simbología disponible'}
                    </div>
                ) : (
                    displayLayers.map((layer, index) => (
                        <SymbologyItem
                            key={layer._isProxy ? `proxy-${layer.id}` : layer.id}
                            layer={layer}
                            isExpanded={true}
                            onToggle={() => { }}
                            priority={index === 0}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default SymbologyPanel;
