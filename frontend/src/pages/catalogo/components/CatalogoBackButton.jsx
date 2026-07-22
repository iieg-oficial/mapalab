import { useState } from 'react';
import { useNavigate } from 'react-router';
import Logo from '@components/Logo';
import Tooltip from '@components/Tooltip';
import Modal from '@components/Modal';
import { CATALOGO_RETURN_KEY } from '../useGoToCatalogo';

const ROUND_BTN = 'size-10 rounded-full bg-white shadow-[0_5px_20px_#1A26641A] flex items-center justify-center text-graphite hover:bg-purple-soft transition-colors cursor-pointer';

const CatalogoBackButton = () => {
    const navigate = useNavigate();
    const [infoOpen, setInfoOpen] = useState(false);

    const handleBack = () => {
        let target = '/mapa';
        try {
            const saved = sessionStorage.getItem(CATALOGO_RETURN_KEY);
            if (saved) target = saved;
        } catch {
            target = '/mapa';
        }
        navigate(target);
    };

    return (
        <>
            <div className="fixed top-4 left-4 z-20 flex flex-row items-stretch gap-2">
                <div className="bg-white rounded-[10px] shadow-[0_5px_20px_#1A26641A]">
                    <Logo
                        name="mapalab"
                        type="short"
                        size="w-14 h-17"
                        onClick={() => navigate('/')}
                        tooltip="Ir al inicio del IIEG"
                        tooltipPlacement="right"
                        className="shrink-0 p-3 flex justify-center"
                    />
                </div>
                <div className="flex flex-col justify-between">
                    <Tooltip content="Regresar a Mapalab" placement="right" delay={200}>
                        <button type="button" onClick={handleBack} aria-label="Regresar a Mapalab" className={ROUND_BTN}>
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                    </Tooltip>
                    <Tooltip content="¿Qué es esta vista?" placement="right" delay={200}>
                        <button
                            type="button"
                            onClick={() => setInfoOpen(true)}
                            aria-label="¿Qué es esta vista?"
                            className={ROUND_BTN}
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 6.5h.01" />
                                <path d="M12 10.5v7" />
                            </svg>
                        </button>
                    </Tooltip>
                </div>
            </div>

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

export default CatalogoBackButton;
