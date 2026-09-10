import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Segmented from '@components/Segmented';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { devToolsStore } from '@services/devToolsStore';
import {
    PANTALLAS,
    PANTALLA_REAL,
    OPCIONES_PANTALLA,
    describirPantalla,
    escalaParaCaber,
} from '@constants/pantallas';

const MARGEN = 32;
const ALTO_BARRA = 56;

const medirEspacio = () => ({
    ancho: window.innerWidth - MARGEN * 2,
    alto: window.innerHeight - ALTO_BARRA - MARGEN,
});

const elegir = (valor) => devToolsStore.setPantalla(valor === PANTALLA_REAL ? null : valor);
const cerrar = () => devToolsStore.setPantalla(null);

const SimuladorPantalla = ({ clave }) => {
    const [src] = useState(() => window.location.href);
    const [espacio, setEspacio] = useState(medirEspacio);
    const pantalla = PANTALLAS[clave];

    useEffect(() => {
        const alRedimensionar = () => setEspacio(medirEspacio());
        const alTeclear = (evento) => {
            if (evento.key === 'Escape') cerrar();
        };
        window.addEventListener('resize', alRedimensionar);
        window.addEventListener('keydown', alTeclear);
        return () => {
            window.removeEventListener('resize', alRedimensionar);
            window.removeEventListener('keydown', alTeclear);
        };
    }, []);

    if (!pantalla) return null;

    const escala = escalaParaCaber(pantalla, espacio);
    const detalle = escala < 1 ? ` · al ${Math.round(escala * 100)} %` : '';

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Simulador de pantallas"
            className="fixed inset-0 z-[9990] flex flex-col items-center bg-[#E9EDF7]"
        >
            <div className="relative flex h-14 w-full shrink-0 items-center justify-center gap-3 px-8">
                <Segmented
                    ariaLabel="Ancho simulado"
                    options={OPCIONES_PANTALLA}
                    value={clave}
                    onChange={elegir}
                />
                <span className="font-garet text-[12px] leading-none text-graphite tabular-nums">
                    {describirPantalla(clave)}{detalle}
                </span>
                <div className="absolute right-6 top-4">
                    <MobileSheetCloseButton onClick={cerrar} />
                </div>
            </div>
            <div
                className="relative shrink-0"
                style={{ width: pantalla.ancho * escala, height: pantalla.alto * escala }}
            >
                <iframe
                    title={`MapaLab en ${describirPantalla(clave)}`}
                    src={src}
                    width={pantalla.ancho}
                    height={pantalla.alto}
                    style={{ transform: `scale(${escala})`, transformOrigin: 'top left' }}
                    className="absolute left-0 top-0 rounded-[10px] border-0 bg-white shadow-[0_5px_20px_#1A26641A]"
                />
            </div>
        </div>,
        document.body,
    );
};

export default SimuladorPantalla;
