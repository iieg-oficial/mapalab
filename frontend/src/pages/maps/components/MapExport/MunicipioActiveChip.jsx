import { useRef, useState } from 'react';
import Icon from '@components/Icon';
import Panel from '@components/Panel';
import Tooltip from '@components/Tooltip';
import { useMapsContext } from '@hooks/useMaps';
import { useSider } from '@contexts/SiderContext';
import { useClearance } from '@hooks/useClearance';
import { trackMunicipioPanelOpen } from '@services/analyticsService';
import { SCOPE_TYPES } from '@pages/maps/hooks/useMunicipioMode';
import MunicipioFilterPanel from './MunicipioFilterPanel';

const MunicipioActiveChip = () => {
    const { municipioMode } = useMapsContext();
    const { active, scope, scopeLabel, exit, sourceId } = municipioMode || {};
    const [closeHovered, setCloseHovered] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef(null);
    const filaRef = useRef(null);
    const { toolsPanelRef } = useSider();
    const superior = useClearance(filaRef, { obstaculos: [toolsPanelRef], base: 16, activo: active && !!scope?.type });


    if (!active || !scope?.type) return null;

    const displayLabel = scope.type === SCOPE_TYPES.ZMG ? 'ZMG' : scopeLabel;

    const handleSetOpen = (open) => {
        setIsOpen(open);
        if (open) trackMunicipioPanelOpen({ source: sourceId, active });
    };

    return (
        <div
            style={{ top: superior }}
            className="flex fixed inset-x-0 z-11 max-md:z-23 justify-center pointer-events-none transition-[top] duration-200"
        >
            <div ref={filaRef} className="flex items-center gap-2 max-w-[60vw] pointer-events-auto">
                <div className="group relative flex min-w-0">
                    <Tooltip
                        content="Salir del modo"
                        placement="right"
                        delay={300}
                        triggerClassName="absolute left-full pl-2 top-1/2 -translate-y-1/2 transition-[opacity,visibility] duration-150 md:invisible md:opacity-0 md:delay-500 md:group-hover:visible md:group-hover:opacity-100 md:group-hover:delay-0 md:group-focus-within:visible md:group-focus-within:opacity-100 md:group-focus-within:delay-0"
                    >
                        <button
                            type="button"
                            onClick={exit}
                            onMouseEnter={() => setCloseHovered(true)}
                            onMouseLeave={() => setCloseHovered(false)}
                            className={[
                                'size-10 flex items-center justify-center rounded-full border border-transparent transition-all cursor-pointer shrink-0',
                                closeHovered ? 'bg-[#FF577D]' : 'bg-[#FFE6EC] hover:border-[#FF577D]',
                            ].join(' ')}
                            aria-label="Salir del modo Vista por municipio"
                        >
                            <Icon name="cerrar" state={closeHovered ? 'hover' : 'normal'} className="size-7" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Click para cambiar de municipio" placement="bottom" delay={300}>
                        <button
                            ref={anchorRef}
                            type="button"
                            onClick={() => handleSetOpen(!isOpen)}
                            className="h-10 flex items-center px-4 rounded-full bg-white shadow-[0_5px_20px_#1A26641A] border border-[#EAEFFA] hover:border-purple transition-all cursor-pointer"
                            aria-label={`Cambiar la selección de municipio. Actual: ${displayLabel}`}
                            aria-expanded={isOpen}
                            aria-haspopup="dialog"
                        >
                            <span className="text-[13px]/[16px] font-garet font-bold text-purple tracking-normal whitespace-nowrap truncate max-w-70">
                                {displayLabel}
                            </span>
                        </button>
                    </Tooltip>
                    <Panel
                        open={isOpen}
                        anchorRef={anchorRef}
                        onClose={() => handleSetOpen(false)}
                        variant="solid"
                        width="w-80"
                        maxHeight="max-h-[32rem] max-md:max-h-[calc(100dvh-158px-1rem)]"
                        className="z-50 shadow-none border-none rounded-[14px]"
                        offset={12}
                        placement="bottom"
                        mobileFullscreen={false}
                        hideHeader
                        noPadding
                        bg="bg-transparent"
                    >
                        <MunicipioFilterPanel municipioMode={municipioMode} onClose={() => handleSetOpen(false)} />
                    </Panel>
                </div>
            </div>
        </div>
    );
};

export default MunicipioActiveChip;
