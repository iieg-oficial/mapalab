import { useState, useRef, useEffect } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';

const IIEG_LAYERS = [
    { id: 'regiones', name: 'Regiones del estado' },
    { id: 'limite_municipal', name: 'Límites municipales IIEG' },
    { id: 'limite_iieg', name: 'Límites estatales IIEG' },
];

const INEGI_LAYERS = [
    { id: 'limite_municipal_inegi', name: 'Límites municipales INEGI' },
    { id: 'limite_inegi', name: 'Límites estatales INEGI' },
];

const SIZE_BUTTON = 'size-4';

const BaseLayersDropdown = ({ isInegiMode }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const {
        activeLayerIds,
        onToggleLayer,
        clearLayerFilters,
        getAllChildLayerIds,
        toggleLayerVisibility,
        hiddenLayerIds,
        setSelectedLayer,
        findLayerById
    } = useMapsContext();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const baseLayers = isInegiMode ? INEGI_LAYERS : IIEG_LAYERS;
    const activeBases = baseLayers.filter(l => activeLayerIds.includes(l.id));

    if (activeBases.length === 0) return null;

    return (
        <div ref={ref} className="relative">
            <Tooltip content="Capas limites">
                <button
                    onClick={(e) => { e.stopPropagation(); setOpen(p => !p); }}
                    className="p-1 rounded-full cursor-pointer border border-transparent hover:border-[#70308A] transition-colors flex items-center justify-center size-7"
                >
                    <Icon name="opciones" state="normal" className="size-3" />
                </button>
            </Tooltip>

            {open && (
                <div className="absolute -right-1 top-full mt-1 z-50 bg-[#F9FBFF] rounded-[10px] shadow-[0_5px_20px_#1A26641A] w-[280px] py-2 px-2 space-y-1">
                    {activeBases.map(layer => {
                        const isVisible = !hiddenLayerIds.includes(layer.id);
                        return (
                            <div key={layer.id} className="flex items-center justify-between px-2 py-1.5 rounded-[7px] bg-white hover:shadow-sm transition-all">
                                <span className="text-[12px] text-[#465055] font-garet font-medium truncate mr-2">
                                    {layer.name}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        className="p-1 rounded-full cursor-pointer hover:bg-[#EAEFFA] transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleLayerVisibility(layer.id);
                                        }}
                                    >
                                        <Icon name="visible" state={isVisible ? 'normal' : 'hover'} className={SIZE_BUTTON} />
                                    </button>
                                    <button
                                        className="p-1 rounded-full cursor-pointer hover:bg-[#EAEFFA] transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const found = findLayerById(layer.id);
                                            if (found) setSelectedLayer(found);
                                        }}
                                    >
                                        <Icon name="big_card" state="normal" className={SIZE_BUTTON} />
                                    </button>
                                    <button
                                        className="p-1 rounded-full cursor-pointer hover:bg-[#FFE8EE] transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const childIds = getAllChildLayerIds(layer.id);
                                            [layer.id, ...childIds].forEach(id => clearLayerFilters(id));
                                            onToggleLayer(layer.id, false);
                                        }}
                                    >
                                        <Icon name="eliminar" state="normal" className={SIZE_BUTTON} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default BaseLayersDropdown;
