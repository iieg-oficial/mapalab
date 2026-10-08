import { createPortal } from 'react-dom';
import Switch from '@components/Switch';
import Segmented from '@components/Segmented';
import { devToolsStore } from '@services/devToolsStore';
import { useIsPreviewingProd, useIsAnalyticsPanelOpen, usePantallaSimulada } from '@hooks/useDevTools';
import { useHoverPopover } from '@hooks/useHoverPopover';
import { OPCIONES_PANTALLA, PANTALLA_REAL } from '@constants/pantallas';
import SimuladorPantalla from './SimuladorPantalla';

const ENV_CONFIG = {
    dev: { label: 'dev', bg: 'bg-purple-500', text: 'text-white' },
    beta: { label: 'test', bg: 'bg-orange-400', text: 'text-white' },
};

const PREVIEW_CONFIG = { label: 'prod', bg: 'bg-gray-700', text: 'text-white' };

const BADGE_CLASS = 'px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase leading-none shadow-sm select-none';
const WRAPPER_CLASS = 'absolute right-0 top-1/3 -translate-y-1/2 translate-x-1/2 z-10';
const ROW_CLASS = 'flex items-center gap-2 whitespace-nowrap';
const LABEL_CLASS = 'font-garet text-[12px] leading-none text-graphite';

const EnvBadge = () => {
    const env = import.meta.env.VITE_APP_ENV;
    const previewingProd = useIsPreviewingProd();
    const analyticsPanelOpen = useIsAnalyticsPanelOpen();
    const pantalla = usePantallaSimulada();
    const { open, position, anchorRef, hoverProps } = useHoverPopover();

    const config = ENV_CONFIG[env];
    if (!config) return null;

    if (!devToolsStore.isToggleAvailable()) {
        return (
            <span className={[config.bg, config.text, WRAPPER_CLASS, BADGE_CLASS, 'pointer-events-none'].join(' ')}>
                {config.label}
            </span>
        );
    }

    const shown = previewingProd ? PREVIEW_CONFIG : config;

    const panel = (
        <div
            {...hoverProps}
            style={{ top: position.top, left: position.left }}
            className="fixed z-[9999] -translate-y-1/2 flex flex-col gap-2 rounded-[8px] bg-white px-3 py-2.5 shadow-[0px_3px_24px_#00000029]"
        >
            <div className={ROW_CLASS}>
                <Switch
                    checked={previewingProd}
                    onChange={(value) => devToolsStore.setPreviewingProd(value)}
                />
                <span className={LABEL_CLASS}>Ver como producción</span>
            </div>
            <div className={ROW_CLASS}>
                <Switch
                    checked={analyticsPanelOpen}
                    disabled={previewingProd}
                    onChange={(value) => devToolsStore.setAnalyticsPanelOpen(value)}
                />
                <span className={previewingProd ? `${LABEL_CLASS} opacity-40` : LABEL_CLASS}>
                    Panel de depuración
                </span>
            </div>
            {!devToolsStore.isInFrame() && (
                <div className="flex flex-col gap-1.5 pt-1">
                    <span className={LABEL_CLASS}>Simular pantalla</span>
                    <Segmented
                        ariaLabel="Simular ancho de pantalla"
                        options={OPCIONES_PANTALLA}
                        value={pantalla ?? PANTALLA_REAL}
                        onChange={(valor) => devToolsStore.setPantalla(valor === PANTALLA_REAL ? null : valor)}
                    />
                </div>
            )}
        </div>
    );

    return (
        <div
            data-sider-nohover
            ref={anchorRef}
            {...hoverProps}
            className={`${WRAPPER_CLASS} flex items-center`}
        >
            <button
                type="button"
                onClick={() => devToolsStore.setPreviewingProd(!previewingProd)}
                aria-pressed={previewingProd}
                aria-label={previewingProd ? 'Volver a la vista de desarrollo' : 'Previsualizar como producción'}
                className={[shown.bg, shown.text, BADGE_CLASS, 'cursor-pointer'].join(' ')}
            >
                {shown.label}
            </button>
            {open && createPortal(panel, document.body)}
            {pantalla && <SimuladorPantalla clave={pantalla} />}
        </div>
    );
};

export default EnvBadge;
