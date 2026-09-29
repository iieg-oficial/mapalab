import { useState } from 'react';
import Icon from '@components/Icon';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { trackMinimapa } from '@services/analyticsService';
import LienzoMinimapa from './LienzoMinimapa';

const LADO_MAXIMO = 360;
const GUTTER = 32;

const MinimapaMovil = ({ vista, siluetas, municipio, map, bloqueado }) => {
    const [abierto, setAbierto] = useState(false);
    const lado = Math.min(window.innerWidth - GUTTER, LADO_MAXIMO);

    const alternar = () => {
        if (!abierto) trackMinimapa('abrir');
        setAbierto(previo => !previo);
    };

    return (
        <div data-minimapa className={`fixed left-4 top-30 flex flex-col items-start gap-4 ${abierto ? 'z-12' : 'z-10'}`}>
            <button
                type="button"
                onClick={alternar}
                aria-expanded={abierto}
                aria-label={`Ver dónde estás en Jalisco: ${municipio?.nombre || 'Jalisco'}`}
                className="flex max-w-[60vw] items-center gap-1.5 rounded-full bg-white py-1 pl-2 pr-3 font-garet text-[12px]/[18px] font-bold text-purple shadow-md"
            >
                <Icon name="ubicacion" className="size-4 shrink-0" />
                <span className="truncate">{municipio?.nombre || 'Jalisco'}</span>
            </button>
            {abierto && (
                <div className="relative">
                    <LienzoMinimapa
                        lado={lado}
                        vista={vista}
                        siluetas={siluetas}
                        municipio={municipio}
                        map={map}
                        bloqueado={bloqueado}
                        onIr={() => setAbierto(false)}
                    />
                    <div className="absolute right-1.5 top-1.5 flex rounded-full bg-white p-0.5 shadow-md">
                        <MobileSheetCloseButton onClick={() => setAbierto(false)} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MinimapaMovil;
