import { useState } from 'react';
import MobileSheet, { MobileSheetCloseButton } from '@components/MobileSheet';
import { trackMinimapa } from '@services/analyticsService';
import { useMinimapa } from '@pages/maps/hooks/useMinimapa';
import IconoHerramienta from '../IconoHerramienta';
import LienzoMinimapa from './LienzoMinimapa';

const LADO_MAXIMO = 360;
const GUTTER = 32;

const HojaMinimapa = ({ cerrar }) => {
    const { visible, lienzo } = useMinimapa(true);
    const lado = Math.min(window.innerWidth - GUTTER, LADO_MAXIMO);
    return (
        <div data-minimapa className="flex flex-col items-center gap-3 px-4 pt-4 pb-6">
            <div className="flex w-full items-center gap-2">
                <span className="truncate font-garet text-[16px]/[22px] font-bold text-purple">
                    {lienzo.municipio?.nombre || 'Jalisco'}
                </span>
                <MobileSheetCloseButton onClick={cerrar} />
            </div>
            <LienzoMinimapa lado={lado} atenuado={!visible} onIr={cerrar} {...lienzo} />
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
                className="flex size-11 items-center justify-center rounded-full bg-white shadow-[0_5px_20px_#1A26641A] cursor-pointer"
            >
                <IconoHerramienta id="minimapa" className="size-8" />
            </button>
            <MobileSheet open={abierto} onClose={cerrar} maxHeightClass="max-h-[70vh]">
                <HojaMinimapa cerrar={cerrar} />
            </MobileSheet>
        </>
    );
};

export default MinimapaMovil;
