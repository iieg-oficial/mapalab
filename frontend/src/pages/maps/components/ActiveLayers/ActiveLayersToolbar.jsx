import { useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import Badge from '@components/Badge';
import Switch from '@components/Switch';
import ConfirmDropdown from '@components/ConfirmDropdown';

const ActiveLayersToolbar = ({
    noLayers,
    unifiedLayers,
    displayedLayers,
    isFiltering,
    allHidden,
    visibilityCount,
    hasActiveLoops,
    activeLoopsCount,
    isInegiMode,
    onToggleVisibilityAll,
    onRemoveAll,
    onPauseAll,
    onToggleBaseMode,
    searchOpen,
    searchQuery,
    onChangeSearchQuery,
    onOpenSearch,
    onCloseSearch,
    onSearchKeyDown,
    searchInputRef,
}) => {
    const [isDeleteHovered, setIsDeleteHovered] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const visibleHeaderButtons = 3 + (hasActiveLoops ? 1 : 0);
    const hideHeaderLabels = visibleHeaderButtons > 2;

    const searchLabel = searchOpen ? 'Cerrar buscador' : 'Buscar capas activas';
    const searchTooltip = noLayers ? 'No hay capas para buscar' : searchLabel;
    const onSearchClick = searchOpen ? onCloseSearch : onOpenSearch;

    return (
        <>
            <div className="flex items-center justify-between shrink-0 mb-2 gap-1.5">
                <div className="flex items-center gap-2 md:gap-3 shrink md:shrink-0 min-w-0">
                    <button
                        type="button"
                        disabled={noLayers}
                        className={`group/vis flex items-center gap-1 shrink-0 ${noLayers ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        onClick={onToggleVisibilityAll}
                    >
                        <span className={`relative p-0.5 rounded-full border border-transparent transition-colors ${noLayers ? '' : 'group-hover/vis:border-purple'}`}>
                            <Icon name="visible" state={allHidden ? 'hover' : 'gray'} className="size-5 shrink-0" />
                            <Badge
                                visible={visibilityCount > 0}
                                count={visibilityCount}
                                color="purple"
                                size="sm"
                                className="absolute -top-1 -right-1 pointer-events-none"
                            />
                        </span>
                        <span className={`${hideHeaderLabels ? 'hidden' : 'inline'} text-[8px] font-garet font-medium text-graphite whitespace-nowrap truncate leading-none pt-[1.5px]`}>{allHidden ? 'Mostrar mis capas' : 'Ocultar mis capas'}</span>
                    </button>

                    <div className="relative shrink-0">
                        <button
                            type="button"
                            disabled={noLayers}
                            onClick={() => setShowDeleteConfirm(p => !p)}
                            onMouseEnter={() => !noLayers && setIsDeleteHovered(true)}
                            onMouseLeave={() => !noLayers && setIsDeleteHovered(false)}
                            className={`group/del flex items-center gap-1 ${noLayers ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                            <span className={`relative p-0.5 rounded-full border border-transparent transition-colors ${noLayers ? '' : 'group-hover/del:border-[#FF577D]'}`}>
                                <Icon name="eliminar" state={isDeleteHovered ? 'hover' : 'normal'} className="size-5 shrink-0" />
                                <Badge
                                    visible={unifiedLayers.length > 0}
                                    count={unifiedLayers.length}
                                    color="pink"
                                    size="sm"
                                    className="absolute -top-1 -right-1 pointer-events-none"
                                />
                            </span>
                            <span className={`${hideHeaderLabels ? 'hidden' : 'inline'} text-[8px] font-garet font-medium whitespace-nowrap truncate leading-none pt-[1.5px] transition-colors ${noLayers ? 'text-graphite' : isDeleteHovered ? 'text-[#FF577D]' : 'text-graphite'}`}>Eliminar mis capas</span>
                        </button>
                        <ConfirmDropdown
                            open={showDeleteConfirm}
                            onClose={() => setShowDeleteConfirm(false)}
                            onConfirm={onRemoveAll}
                            title="¿Estás seguro de borrar todas las capas que tienes activas?"
                            description="Si las borras deberás activar una por una nuevamente"
                            confirmText="Sí. Quiero borrar todas las capas"
                            className="right-0 md:right-0 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0"
                        />
                    </div>

                    <Tooltip content={searchTooltip}>
                        <button
                            type="button"
                            disabled={noLayers}
                            aria-label={searchTooltip}
                            aria-pressed={searchOpen}
                            onClick={onSearchClick}
                            className={`p-0.5 rounded-full border transition-colors shrink-0 ${noLayers ? 'cursor-not-allowed opacity-50 border-transparent' : `cursor-pointer ${searchOpen ? 'border-purple bg-[#F2EBFF]' : 'border-transparent hover:border-purple'}`}`}
                        >
                            <Icon name="searchLayer" state={searchOpen ? 'hover' : 'normal'} className="size-5 shrink-0" />
                        </button>
                    </Tooltip>

                    {hasActiveLoops && (
                        <button
                            type="button"
                            className="group/pauseall flex items-center gap-1 shrink-0 cursor-pointer"
                            onClick={onPauseAll}
                        >
                            <span className="relative p-0.5 rounded-full border border-transparent transition-colors group-hover/pauseall:border-orange">
                                <span className="size-5 flex items-center justify-center text-purple group-hover/pauseall:text-orange transition-colors">
                                    <Icon name="pause_all" className="size-3 shrink-0" />
                                </span>
                                <Badge
                                    visible={activeLoopsCount > 0}
                                    count={activeLoopsCount}
                                    color="orange"
                                    size="sm"
                                    className="absolute -top-1 -right-1 pointer-events-none"
                                />
                            </span>
                            <span className={`${hideHeaderLabels ? 'hidden' : 'inline'} text-[8px] font-garet font-medium whitespace-nowrap truncate leading-none pt-[1.5px] text-orange`}>Pausar animaciones</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <Switch
                        checked={!isInegiMode}
                        onChange={onToggleBaseMode}
                        onLabel="IIEG"
                        offLabel="INEGI"
                        onColor={noLayers ? '#d1d5db' : '#70308A'}
                        offColor="#FF8300"
                        tooltip={noLayers ? 'Activar capas IIEG' : (isInegiMode ? 'Cambiar a IIEG' : 'Cambiar a INEGI')}
                    />
                </div>
            </div>

            {searchOpen && (
                <div className="relative mb-2 shrink-0">
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onChangeSearchQuery(e.target.value)}
                        onKeyDown={onSearchKeyDown}
                        placeholder="Buscar capas activas"
                        className="
                        w-full py-3 pl-4 pr-20 border-none bg-[#EAEFFA] rounded-lg
                        text-[13px]/[19px] text-purple font-garet font-normal tracking-normal
                        placeholder:text-[#191919] placeholder:font-garet placeholder:font-normal placeholder:text-[13px]/[19px]
                        focus:outline-purple transition-colors
                    "
                    />
                    {isFiltering && (
                        <span className="absolute right-15 top-1/2 -translate-y-1/2 text-[11px] font-garet text-graphite pointer-events-none">
                            {displayedLayers.length}/{unifiedLayers.length}
                        </span>
                    )}
                    <Tooltip content="Cerrar y limpiar búsqueda">
                        <button
                            type="button"
                            aria-label="Cerrar y limpiar búsqueda"
                            onClick={onCloseSearch}
                            className="
                            absolute right-0 top-1/2 -translate-y-1/2 h-full w-12.75
                            bg-purple-deep hover:bg-purple rounded-r-lg
                            flex items-center justify-center transition-colors cursor-pointer
                        "
                        >
                            <Icon name="searchInput" className="size-5" />
                        </button>
                    </Tooltip>
                </div>
            )}
        </>
    );
};

export default ActiveLayersToolbar;
