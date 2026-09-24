import { useEffect, useState } from 'react';
import Tooltip from '@components/Tooltip';
import Modal from '@components/Modal';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { trackCatalogoInfoOpen } from '@services/analyticsService';
import { useFeatureSeen } from '@hooks/useFeatureSeen';
import { useIsNonProd } from '@hooks/useDevTools';

const FUNCIONES = [
    { titulo: 'Buscar', texto: 'Por nombre o etiqueta, o filtrando por institución.' },
    { titulo: 'Consultar', texto: 'Clic en el mapa para ver la tarjeta de un elemento, o dibuja un polígono para varios.' },
    { titulo: 'Tiempo', texto: 'Si la capa tiene fechas, elige año o mes en la barra y anímala.' },
    { titulo: 'Descargar', texto: 'En GPKG, SHP o CSV; las capas de imagen, en ráster.' },
    { titulo: 'Compartir', texto: 'La capa o el catálogo de una institución, con enlace o código QR.' },
    { titulo: 'Medir y anotar', texto: 'Distancias, áreas, texto y trazos sobre el mapa.' },
    { titulo: 'Tabla de datos', texto: 'Los registros de la capa, con filtros por columna.', soloBeta: true },
    { titulo: 'Personalizar la tarjeta', texto: 'Propón qué datos muestra; el IIEG la revisa antes de publicarla.', soloBeta: true },
];

const CatalogoInfoButton = () => {
    const [infoOpen, setInfoOpen] = useState(false);
    const [hintSeen, markHintSeen] = useFeatureSeen('catalogo-info-hint');
    const [hintVisible, setHintVisible] = useState(!hintSeen);
    const isNonProd = useIsNonProd();
    const funciones = FUNCIONES.filter((f) => !f.soloBeta || isNonProd);

    useEffect(() => {
        if (!hintVisible) return undefined;
        const temporizador = setTimeout(() => setHintVisible(false), 8000);
        return () => clearTimeout(temporizador);
    }, [hintVisible]);

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
                    <div className="flex items-center justify-between gap-4 mb-2">
                        <h3 className="text-[20px] font-bold text-purple">¿Qué es el Catálogo?</h3>
                        <MobileSheetCloseButton onClick={() => setInfoOpen(false)} />
                    </div>
                    <p className="mb-4">
                        Una vista simplificada para explorar las capas del IIEG <span className="font-bold text-purple">una por una</span>.
                    </p>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-[13px]/[19px]">
                        {funciones.map((f) => (
                            <div key={f.titulo} className="contents">
                                <dt className="font-bold text-purple">{f.titulo}</dt>
                                <dd>{f.texto}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-4 text-[12px]/[18px] text-[#6E7477]">
                        Para combinar varias capas, usa <b>Regresar a Mapalab</b>. Las capas del catálogo las da de alta el IIEG.
                    </p>
                </div>
            </Modal>
        </>
    );
};

export default CatalogoInfoButton;
