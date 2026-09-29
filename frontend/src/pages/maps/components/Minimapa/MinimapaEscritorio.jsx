import { useRef } from 'react';
import Tooltip from '@components/Tooltip';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { trackMinimapa } from '@services/analyticsService';
import { useMinimapa } from '@pages/maps/hooks/useMinimapa';
import { useTapado } from '@pages/maps/hooks/useTapado';
import { fijarMinimapaEncendido } from '@pages/maps/hooks/useMinimapaEncendido';
import { TAMANO_MINIMAPA } from '@pages/maps/helpers/minimapa';
import LienzoMinimapa from './LienzoMinimapa';

const OBSTACULOS = ['[data-panel-numeralia]', '[data-barra-tabla]', '[role="dialog"]', '[role="menu"]'];

const MinimapaEscritorio = () => {
    const { visible, lienzo } = useMinimapa();
    const cajaRef = useRef(null);
    const tapado = useTapado(cajaRef, OBSTACULOS, visible);

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
            className={`group absolute left-full bottom-0 ml-3 flex flex-col items-center gap-1.5 transition-opacity duration-200 ${tapado ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            style={{ width: TAMANO_MINIMAPA }}
        >
            <div className="relative">
                <LienzoMinimapa lado={TAMANO_MINIMAPA} sinFondo {...lienzo} />
                <div className="absolute right-0 top-0 flex rounded-full bg-white p-0.5 opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                    <Tooltip content="Quitar el minimapa. Vuelve desde Herramientas" placement="top" delay={300}>
                        <MobileSheetCloseButton onClick={apagar} />
                    </Tooltip>
                </div>
            </div>
            <span className="pointer-events-none max-w-full truncate rounded-full bg-white px-2.5 py-0.5 font-garet text-[11px]/[16px] font-bold text-purple shadow-md">
                {lienzo.municipio?.nombre || 'Jalisco'}
            </span>
        </div>
    );
};

export default MinimapaEscritorio;
