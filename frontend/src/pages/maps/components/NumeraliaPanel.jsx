import { useEffect, useRef, useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useMapsContext } from '@hooks/useMaps';
import { useSider } from '@contexts/SiderContext';
import { SIDER_TRANSITION_CLASSES } from '@constants/sider';
import { PANEL_GAP, VIEWPORT_EDGE } from '@pages/maps/helpers/mapFit';
import { useNumeraliaPanel } from '@contexts/NumeraliaPanelContext';
import { useLayerMetadata, useMetadataContext } from '@hooksMaps/useLayerMetadata';
import StatCard from './LayerDetailModal/components/StatCard';

const NumeraliaPanel = () => {
    const { abierto, minimizado, detachedLayerId, attach, seguir, alternarMinimizado, highlight } = useNumeraliaPanel();
    const { municipioMode, selectedLayer, selectedLayerForSymbology } = useMapsContext();
    const { width: siderWidth, isMobile } = useSider();
    const enFoco = selectedLayerForSymbology?.id || selectedLayer?.id || null;
    const layerId = abierto ? (enFoco || detachedLayerId) : null;
    const { metadata } = useLayerMetadata(layerId, useMetadataContext(municipioMode));
    const [resaltado, setResaltado] = useState(false);
    const panelRef = useRef(null);

    useEffect(() => {
        if (abierto && enFoco) seguir(enFoco);
    }, [abierto, enFoco, seguir]);

    useEffect(() => {
        if (!highlight) return undefined;
        setResaltado(true);
        const id = setTimeout(() => setResaltado(false), 1200);
        return () => clearTimeout(id);
    }, [highlight]);

    const slots = (metadata?.numeralia || []).filter(s => s.nombre && s.valor);
    if (!abierto || slots.length === 0) return null;

    const ambito = metadata?.ambito;
    const nombreCapa = metadata.nombre_capa_usuario || 'Estadísticas';
    const anillo = resaltado ? 'ring-2 ring-[#70308A]' : '';

    return (
        <div
            className={`flex fixed bottom-15 md:bottom-16 z-11 justify-center pointer-events-none ${SIDER_TRANSITION_CLASSES}`}
            style={{
                left: isMobile ? VIEWPORT_EDGE : siderWidth + VIEWPORT_EDGE + PANEL_GAP,
                right: VIEWPORT_EDGE + (isMobile ? 0 : PANEL_GAP),
            }}
        >
            {minimizado ? (
                <button
                    type="button"
                    ref={panelRef}
                    onClick={alternarMinimizado}
                    aria-expanded="false"
                    aria-label={`Abrir las estadísticas de ${nombreCapa}`}
                    className={`pointer-events-auto max-w-full flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-[#F9FBFF] shadow-[0_5px_20px_#1A26641A] cursor-pointer transition-shadow ${anillo}`}
                >
                    <Icon name="numeralia" className="size-5 shrink-0 text-purple" />
                    <span className="font-garet font-bold text-[12px]/[15px] truncate">{nombreCapa}</span>
                    <Icon name="upArrow" className="size-2.5 shrink-0" />
                </button>
            ) : (
                <section
                    ref={panelRef}
                    className={`pointer-events-auto max-w-full max-h-[60vh] overflow-auto scrollbar-thin px-4 py-2.5 rounded-[10px] bg-[#F9FBFF] shadow-[0_5px_20px_#1A26641A] transition-shadow ${anillo}`}
                    aria-label={`Estadísticas de ${nombreCapa}`}
                    aria-live="polite"
                >
                    <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <Icon name="numeralia" className="size-8 shrink-0 text-purple" />
                            <h3 className="font-garet font-bold text-[13px]/[16px] truncate">{nombreCapa}</h3>
                            <p className="text-[11px]/[13px] font-garet font-bold text-purple tracking-normal shrink-0">
                                {ambito?.geografico || 'Jalisco'}
                                {ambito?.temporal && <span className="text-orange"> {ambito.temporal}</span>}
                            </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                            <Tooltip content="Minimizar estadísticas">
                                <button
                                    type="button"
                                    onClick={alternarMinimizado}
                                    aria-expanded="true"
                                    className="size-6 flex items-center justify-center rounded-full text-purple hover:bg-purple hover:text-white transition cursor-pointer"
                                    aria-label="Minimizar el panel de estadísticas"
                                >
                                    <span className="block w-2.5 h-[2px] bg-current rounded-full" />
                                </button>
                            </Tooltip>

                            <Tooltip content="Cerrar estadísticas">
                                <button
                                    type="button"
                                    onClick={attach}
                                    className="size-6 flex items-center justify-center rounded-full text-purple hover:bg-purple hover:text-white transition cursor-pointer"
                                    aria-label="Cerrar el panel de estadísticas"
                                >
                                    <Icon name="close" className="size-3.5" />
                                </button>
                            </Tooltip>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 auto-rows-fr gap-2 md:grid-cols-none md:grid-rows-2 md:grid-flow-col md:auto-cols-[minmax(120px,1fr)]">
                        {slots.map((stat, index) => (
                            <StatCard key={index} label={stat.nombre} value={stat.valor} simbolo={stat.simbolo} size="compact" receta={stat.receta} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default NumeraliaPanel;
