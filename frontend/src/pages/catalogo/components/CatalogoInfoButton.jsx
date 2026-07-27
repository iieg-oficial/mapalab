import { useState } from 'react';
import Tooltip from '@components/Tooltip';
import Modal from '@components/Modal';
import { trackCatalogoInfoOpen } from '@services/analyticsService';
import { useFeatureSeen } from '@hooks/useFeatureSeen';

const CatalogoInfoButton = () => {
    const [infoOpen, setInfoOpen] = useState(false);
    const [hintSeen, markHintSeen] = useFeatureSeen('catalogo-info-hint');
    const [hintVisible, setHintVisible] = useState(!hintSeen);

    const dismissHint = () => {
        if (!hintVisible) return;
        setHintVisible(false);
        markHintSeen();
    };

    return (
        <>
            <Tooltip content="¿Qué es esta vista?" placement="top" delay={200} forceVisible={hintVisible}>
                <button
                    type="button"
                    onClick={() => { dismissHint(); trackCatalogoInfoOpen(); setInfoOpen(true); }}
                    onMouseEnter={dismissHint}
                    aria-label="¿Qué es esta vista?"
                    className="size-7 md:size-6 rounded-full border border-[#FFE4C4] hover:border-[#FFD9AD] bg-[#FFE4C4] hover:bg-[#FFD9AD] text-orange flex items-center justify-center transition-colors shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)] cursor-pointer"
                >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 6.5h.01" />
                        <path d="M12 10.5v7" />
                    </svg>
                </button>
            </Tooltip>

            <Modal isOpen={infoOpen} onClose={() => setInfoOpen(false)} showHeader={false} width="max-w-lg">
                <div className="px-6 pt-5 pb-6 font-garet text-[#454545] text-[14px]/[22px]">
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="text-[20px] font-bold text-purple">¿Qué es el Catálogo?</h3>
                        <button
                            type="button"
                            onClick={() => setInfoOpen(false)}
                            aria-label="Cerrar"
                            className="shrink-0 -mr-1.5 p-1.5 rounded-full text-[#6E7477] hover:text-purple hover:bg-purple-soft transition-colors"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="space-y-3">
                        <p>
                            El <span className="font-bold text-purple">Catálogo</span> es una vista simplificada para
                            explorar y descargar capas de información geográfica del IIEG de forma individual.
                        </p>
                        <ul className="space-y-2">
                            <li className="flex gap-2"><span className="shrink-0 text-purple">•</span><span>Busca una capa por nombre o etiqueta y visualízala en el mapa.</span></li>
                            <li className="flex gap-2"><span className="shrink-0 text-purple">•</span><span>Consulta su leyenda y descárgala en <b>GPKG</b>, <b>Shapefile</b> o <b>CSV</b>.</span></li>
                            <li className="flex gap-2"><span className="shrink-0 text-purple">•</span><span>Usa <b>Regresar a Mapalab</b> para volver al visor completo.</span></li>
                        </ul>
                        <p className="text-[12px]/[18px] text-[#6E7477]">
                            Las capas del catálogo se dan de alta desde el panel de administración del IIEG.
                        </p>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default CatalogoInfoButton;
