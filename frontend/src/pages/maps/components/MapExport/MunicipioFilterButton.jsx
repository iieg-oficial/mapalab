import { useRef, useState } from 'react';
import Panel from '@components/Panel';
import Tooltip from '@components/Tooltip';
import { useSider } from '@contexts/SiderContext';
import { trackMunicipioPanelOpen } from '@services/analyticsService';
import { SCOPE_TYPES } from '@pages/maps/hooks/useMunicipioMode';
import MunicipioFilterPanel from './MunicipioFilterPanel';

const IS_NON_PROD = ['dev', 'beta'].includes(import.meta.env.VITE_APP_ENV);

const buildLabel = (municipioMode) => {
    const { active, scope, scopeLabel } = municipioMode;
    if (!active || !scope?.type) return 'Jalisco';
    if (scope.type === SCOPE_TYPES.ZMG) return 'ZMG';
    if (scope.type === SCOPE_TYPES.REGION) return scope.value || 'Región';
    return scopeLabel || 'Jalisco';
};

const MunicipioFilterButton = ({ municipioMode, onOpenChange, collapsed = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef(null);
    const { isMobile } = useSider();

    if (!IS_NON_PROD || !municipioMode) return null;

    const handleSetOpen = (open) => {
        setIsOpen(open);
        onOpenChange?.(open);
        if (open) {
            trackMunicipioPanelOpen({ source: municipioMode.sourceId, active: municipioMode.active });
        }
    };

    const label = buildLabel(municipioMode);
    const isActive = !!municipioMode.scope?.type && municipioMode.active;
    const showLabel = !isMobile && !collapsed;

    return (
        <div className="flex flex-col relative w-full">
            <Tooltip content="Vista por municipio" placement="top" delay={300}>
                <button
                    ref={anchorRef}
                    type="button"
                    onClick={() => handleSetOpen(!isOpen)}
                    className={[
                        'flex items-center justify-center relative',
                        showLabel ? 'w-full px-3' : 'w-12.5',
                        'h-12.5 rounded-[30px] transition',
                        'bg-[#5C247234] hover:bg-[#D8DFF0] text-purple',
                        'font-garet font-bold text-[13px] hover:shadow-[0_6px_6px_#5C247234]',
                        isActive ? 'ring ring-purple' : '',
                    ].join(' ')}
                    aria-label="Vista por municipio"
                >
                    {showLabel ? (
                        <span className="truncate w-full text-center">{label}</span>
                    ) : (
                        <span className="text-[10px] font-bold">JAL</span>
                    )}
                    <span
                        className={[
                            'absolute -top-1 -right-1 z-10',
                            'px-1.5 py-0.5 rounded-full',
                            'text-[8px]/[10px] font-garet font-bold uppercase tracking-wider',
                            'bg-orange text-white shadow-sm pointer-events-none',
                        ].join(' ')}
                    >
                        beta
                    </span>
                </button>
            </Tooltip>

            <Panel
                open={isOpen}
                anchorRef={anchorRef}
                onClose={() => handleSetOpen(false)}
                variant="solid"
                width="w-80"
                maxHeight="max-h-[32rem] max-md:max-h-[calc(100dvh-6rem)]"
                className="z-50 mt-4 shadow-none border-none rounded-[14px]"
                placement="bottom-end"
                mobileFullscreen={false}
                hideHeader
                noPadding
                bg="bg-transparent"
            >
                <MunicipioFilterPanel municipioMode={municipioMode} />
            </Panel>
        </div>
    );
};

export default MunicipioFilterButton;
