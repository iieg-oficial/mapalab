import { useEffect, useRef, useState } from 'react';
import Tooltip from '@components/Tooltip';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { trackMinimapa } from '@services/analyticsService';
import { useMinimapa } from '@pages/maps/hooks/useMinimapa';
import { useTapado } from '@pages/maps/hooks/useTapado';
import { fijarMinimapaEncendido } from '@pages/maps/hooks/useMinimapaEncendido';
import { TAMANO_MINIMAPA } from '@pages/maps/helpers/minimapa';
import LienzoMinimapa from './LienzoMinimapa';

const OBSTACULOS = ['[data-panel-numeralia]', '[data-barra-tabla]', '[role="dialog"]', '[role="menu"]'];

const useAlto = (ref, activo) => {
    const [alto, setAlto] = useState(TAMANO_MINIMAPA);
    useEffect(() => {
        const nodo = ref.current;
        if (!activo || !nodo || typeof ResizeObserver === 'undefined') return undefined;
        const medir = () => {
            const medida = Math.round(nodo.getBoundingClientRect().height);
            if (medida) setAlto(medida);
        };
        medir();
        const observador = new ResizeObserver(medir);
        observador.observe(nodo);
        return () => observador.disconnect();
    }, [ref, activo]);
    return alto;
};

const MinimapaEscritorio = () => {
    const { visible, lienzo } = useMinimapa();
    const cajaRef = useRef(null);
    const tapado = useTapado(cajaRef, OBSTACULOS, visible);
    const lado = useAlto(cajaRef, visible);

    if (!visible) return null;

    const apagar = () => {
        fijarMinimapaEncendido(false);
        trackMinimapa('apagar');
    };

    return (
        <div
            ref={cajaRef}
            data-minimapa
            aria-hidden={tapado}
            className={`group absolute left-full top-0 bottom-0 ml-3 transition-opacity duration-200 ${tapado ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            style={{ width: lado }}
        >
            <div className="relative">
                <LienzoMinimapa lado={lado} sinFondo {...lienzo} />
                <div className="absolute right-0 top-0 flex rounded-full bg-white p-0.5 opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                    <Tooltip content="Quitar el minimapa. Vuelve desde Herramientas" placement="top" delay={300}>
                        <MobileSheetCloseButton onClick={apagar} />
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};

export default MinimapaEscritorio;
