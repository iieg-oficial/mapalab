import { useRef, useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import Switch from '@components/Switch';
import Loading from '@components/Loading';
import LayerOpacityPopover from './LayerOpacityPopover';
import { useLegendsVisibility } from './hooks/useLegendsVisibility';
import { useStatsVisibility } from './hooks/useStatsVisibility';
import { useMapsContext } from '@hooks/useMaps';

const SIZE_BUTTON = 'size-5';
const BUTTON_BASE = 'p-1.5 rounded-full transition-colors cursor-pointer border border-transparent bg-[#F9FBFF]';

const LayerActionsBar = ({
    visible,
    isLoading,
    isLooping,
    canOpenModal,
    opacity = 1,
    enHexagonos = false,
    conFondo = true,
    onToggleFondo,
    onToggleVisibility,
    onOpenDetails,
    onChangeOpacity,
    onRemove,
    hasLegend = false,
    slotMembership = null,
    activeSlot = null,
    onSwitchSlot,
    canDownload = false,
    hasStats = false,
    isDownloading = false,
    onDownloadClick,
    downloadButtonRef,
    layerId = null,
}) => {
    const [isCardHovered, setIsCardHovered] = useState(false);
    const [isDeleteHovered, setIsDeleteHovered] = useState(false);
    const [isVisibleHovered, setIsVisibleHovered] = useState(false);
    const [isLegendsHovered, setIsLegendsHovered] = useState(false);
    const [isOpacityOpen, setIsOpacityOpen] = useState(false);
    const opacityButtonRef = useRef(null);
    const { visible: legendsVisible, setVisible: setLegendsVisible } = useLegendsVisibility();
    const { visible: statsVisible, setVisible: setStatsVisible } = useStatsVisibility();
    const { setHighlightedSlots } = useMapsContext();

    const opacityPercent = Math.round(opacity * 100);
    const opacityCustom = opacityPercent !== 100;

    const targetSlot = slotMembership === 'AB' ? activeSlot : slotMembership;
    const otherSlot = activeSlot === 'A' ? 'B' : 'A';
    const sideTag = targetSlot ? ` del lado ${targetSlot}` : '';
    const ABWarning = slotMembership === 'AB' ? ` (seguirá en el lado ${otherSlot})` : '';

    return (
        <div className="flex items-center gap-1 w-full">
            <Tooltip content={`${visible ? 'Ocultar' : 'Mostrar'} capa${sideTag}${visible ? ABWarning : ''}`}>
                <button
                    className={`${BUTTON_BASE} hover:border-[#70308A]`}
                    onClick={onToggleVisibility}
                    onMouseEnter={() => setIsVisibleHovered(true)}
                    onMouseLeave={() => setIsVisibleHovered(false)}
                >
                    <Icon
                        name="visible"
                        state={visible ? (isVisibleHovered ? 'normal' : 'gray') : 'hover'}
                        className={SIZE_BUTTON}
                    />
                </button>
            </Tooltip>

            {(!isLoading || isLooping) && canOpenModal && (
                <Tooltip content="Ver detalles de capa">
                    <button
                        className={`${BUTTON_BASE} hover:border-[#70308A]`}
                        onClick={onOpenDetails}
                        onMouseEnter={() => setIsCardHovered(true)}
                        onMouseLeave={() => setIsCardHovered(false)}
                    >
                        <Icon name="big_card" state={isCardHovered ? 'hover' : 'normal'} className={SIZE_BUTTON} />
                    </button>
                </Tooltip>
            )}

            {enHexagonos ? (
                <Tooltip content={conFondo ? 'Quitar el relleno y dejar solo el contorno' : 'Rellenar los hexágonos'}>
                    <button
                        aria-pressed={!conFondo}
                        className={`${BUTTON_BASE} hover:border-[#70308A] flex items-center justify-center ${conFondo ? 'text-[#5C2472]' : 'text-gray-400'}`}
                        onClick={(e) => { e.stopPropagation(); onToggleFondo?.(); }}
                    >
                        {statsVisible ? (
                            <Icon name="upArrow" className="size-3" />
                        ) : (
                            <Icon name="numeralia" className={SIZE_BUTTON} />
                        )}
                    </button>
                </Tooltip>
            ) : (
                <Tooltip content={`Opacidad${sideTag}${opacityCustom ? `: ${opacityPercent}%` : ''}`}>
                    <button
                        ref={opacityButtonRef}
                        className={`${BUTTON_BASE} hover:border-[#70308A] flex items-center justify-center text-gray-500 hover:text-[#5C2472]`}
                        onClick={(e) => { e.stopPropagation(); setIsOpacityOpen(p => !p); }}
                    >
                        {opacityCustom ? (
                            <span className={`${SIZE_BUTTON} flex items-center justify-center text-[10px] font-garet font-bold tabular-nums leading-none`}>{opacityPercent}</span>
                        ) : (
                            <Icon name="opacity" className={SIZE_BUTTON} />
                        )}
                    </button>
                </Tooltip>
            )}
            {!enHexagonos && isOpacityOpen && (
                <LayerOpacityPopover
                    anchorRef={opacityButtonRef}
                    value={opacity}
                    onChange={onChangeOpacity}
                    onClose={() => setIsOpacityOpen(false)}
                    layerId={layerId}
                />
            )}

            {canDownload && (
                <Tooltip content={isDownloading ? 'Cancelar descarga' : `Descargar capa${sideTag}`}>
                    <button
                        ref={downloadButtonRef}
                        className={`${BUTTON_BASE} hover:border-[#70308A] flex items-center justify-center text-gray-500 hover:text-[#5C2472]`}
                        onClick={(e) => { e.stopPropagation(); onDownloadClick?.(); }}
                    >
                        {isDownloading ? (
                            <Loading visible size={SIZE_BUTTON} border="border-2" color="border-[#FF8300]" />
                        ) : (
                            <Icon name="download" className={SIZE_BUTTON} />
                        )}
                    </button>
                </Tooltip>
            )}

            {hasStats && (
                <Tooltip content={`${statsVisible ? 'Ocultar' : 'Mostrar'} estadísticas`}>
                    <button
                        className={`p-1.5 rounded-full transition-colors cursor-pointer flex items-center justify-center size-8 ${statsVisible ? 'bg-white border border-[#70308A]' : `${BUTTON_BASE} hover:border-[#70308A]`}`}
                        onClick={(e) => { e.stopPropagation(); setStatsVisible(p => !p); }}
                        aria-pressed={statsVisible}
                        aria-label={`${statsVisible ? 'Ocultar' : 'Mostrar'} estadísticas de la capa`}
                    >
                        <Icon name="geom_hexbin" className={SIZE_BUTTON} />
                    </button>
                </Tooltip>
            )}

            {hasLegend && (
                <Tooltip content={`${legendsVisible ? 'Ocultar' : 'Mostrar'} leyendas${targetSlot ? ` del lado ${targetSlot}` : ''}`}>
                    <button
                        className={`p-1.5 rounded-full transition-colors cursor-pointer flex items-center justify-center size-8 ${legendsVisible ? 'bg-white border border-[#70308A]' : `${BUTTON_BASE} hover:border-[#70308A]`}`}
                        onClick={(e) => { e.stopPropagation(); setLegendsVisible(p => !p); }}
                        onMouseEnter={() => setIsLegendsHovered(true)}
                        onMouseLeave={() => setIsLegendsHovered(false)}
                    >
                        {legendsVisible ? (
                            <Icon name="upArrow" className="size-3" />
                        ) : (
                            <Icon name="simbologia" state={isLegendsHovered ? 'normal' : 'gray'} className="size-[22px]" />
                        )}
                    </button>
                </Tooltip>
            )}

            <div className="flex-1" />

            {slotMembership === 'AB' && (
                <Switch
                    checked={activeSlot === 'A'}
                    onChange={(next) => {
                        const target = next ? 'A' : 'B';
                        onSwitchSlot?.(target);
                        setHighlightedSlots?.(target);
                        setTimeout(() => setHighlightedSlots?.(null), 1500);
                    }}
                    onLabel="A"
                    offLabel="B"
                    onColor="#5C2472"
                    offColor="#FF8300"
                    tooltip={`Editando lado ${activeSlot} — cambiar a ${activeSlot === 'A' ? 'B' : 'A'}`}
                />
            )}

            <Tooltip content="Eliminar capa">
                <button
                    className={`${BUTTON_BASE} hover:border-[#FF577D]`}
                    onClick={onRemove}
                    onMouseEnter={() => setIsDeleteHovered(true)}
                    onMouseLeave={() => setIsDeleteHovered(false)}
                >
                    <Icon name="eliminar" state={isDeleteHovered ? 'hover' : 'normal'} className={SIZE_BUTTON} />
                </button>
            </Tooltip>
        </div>
    );
};

export default LayerActionsBar;
