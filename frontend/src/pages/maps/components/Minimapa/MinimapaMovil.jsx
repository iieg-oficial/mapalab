import { useEffect, useRef, useState } from 'react';
import MobileSheet, { MobileSheetCloseButton } from '@components/MobileSheet';
import { trackMinimapa } from '@services/analyticsService';
import { useMinimapa } from '@pages/maps/hooks/useMinimapa';
import IconoHerramienta from '../IconoHerramienta';
import Badge from '@components/Badge';
import LienzoMinimapa from './LienzoMinimapa';

const ALTO_MAXIMO = 0.7;

const useLado = (ref) => {
    const [lado, setLado] = useState(0);
    useEffect(() => {
        const nodo = ref.current;
        if (!nodo) return undefined;
        const medir = () => setLado(Math.floor(Math.min(nodo.clientWidth || window.innerWidth, window.innerHeight * ALTO_MAXIMO)));
        medir();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observador = new ResizeObserver(medir);
        observador.observe(nodo);
        return () => observador.disconnect();
    }, [ref]);
    return lado;
};

const HojaMinimapa = ({ cerrar }) => {
    const { visible, lienzo } = useMinimapa(true);
    const cajaRef = useRef(null);
    const lado = useLado(cajaRef);
    return (
        <div ref={cajaRef} data-minimapa className="relative flex w-full justify-center">
            {lado > 0 && <LienzoMinimapa lado={lado} atenuado={!visible} onIr={cerrar} {...lienzo} />}
            <span className="absolute left-4 top-3 max-w-[70%] truncate font-garet text-[16px]/[22px] font-bold text-purple">
                {lienzo.municipio?.nombre || 'Jalisco'}
            </span>
            <div className="absolute right-3 top-3 flex">
                <MobileSheetCloseButton onClick={cerrar} />
            </div>
        </div>
    );
};

const MinimapaMovil = () => {
    const [abierto, setAbierto] = useState(false);

    const abrir = () => {
        trackMinimapa('abrir');
        setAbierto(true);
    };
    const cerrar = () => setAbierto(false);

    return (
        <>
            <button
                type="button"
                onClick={abrir}
                aria-expanded={abierto}
                aria-label="Ver dónde estás en Jalisco"
                title="Minimapa"
                className="relative flex size-11 items-center justify-center rounded-full bg-white shadow-[0_5px_20px_#1A26641A] cursor-pointer"
            >
                <IconoHerramienta id="minimapa" className="size-8" />
                <Badge variant="pill" color="orange" text="BETA" className="absolute -top-2 -right-3 text-[8px] px-1.5 pointer-events-none" />
            </button>
            <MobileSheet open={abierto} onClose={cerrar} maxHeightClass="max-h-[70vh]">
                <HojaMinimapa cerrar={cerrar} />
            </MobileSheet>
        </>
    );
};

export default MinimapaMovil;
