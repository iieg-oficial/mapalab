import { useRef, useState } from 'react';
import Tooltip from '@components/Tooltip';
import PillCloseButton from '@components/PillCloseButton';
import { useOutsideClick } from '@hooks/useOutsideClick';
import { SCOPE_TYPES } from '@pages/maps/hooks/useMunicipioMode';
import MunicipioFilterPanel from '@mapsComponents/MapExport/MunicipioFilterPanel';
import { trackMunicipioPanelOpen } from '@services/analyticsService';
import { PANEL_SHADOW } from '../helpers/catalogoStyles';

const SIN_FILTRO = 'Todo Jalisco';

export const CERRAR_DEBAJO = 'absolute top-full mt-1.5 left-1/2 -translate-x-1/2';

const CatalogoMunicipioPill = ({ municipio }) => {
    const [abierto, setAbierto] = useState(false);
    const contenedorRef = useRef(null);
    const { active, scope, scopeLabel, sourceId, exit } = municipio;
    const conFiltro = active && !!scope?.type;
    useOutsideClick([contenedorRef], () => setAbierto(false));
    const etiqueta = !conFiltro ? SIN_FILTRO : scope.type === SCOPE_TYPES.ZMG ? 'ZMG' : scopeLabel;

    const alternar = () => {
        if (!abierto) trackMunicipioPanelOpen({ source: sourceId, active });
        setAbierto((v) => !v);
    };

    return (
        <div ref={contenedorRef} className={`group relative flex items-center gap-1.5 h-10 px-1.5 bg-white rounded-full ${PANEL_SHADOW}`}>
            <Tooltip content="Ver un municipio, una región o la ZMG" placement="right" delay={300}>
                <button
                    type="button"
                    onClick={alternar}
                    aria-expanded={abierto}
                    aria-haspopup="dialog"
                    className={`max-w-48 truncate px-3 py-1 rounded-full text-[12px] font-garet font-bold transition-colors cursor-pointer ${abierto
                        ? 'bg-purple-deep text-white'
                        : 'text-purple hover:bg-purple-soft'}`}
                >
                    {etiqueta}
                </button>
            </Tooltip>

            {conFiltro && !abierto && (
                <PillCloseButton
                    onClick={exit}
                    tooltip="Quitar el filtro de municipio"
                    ariaLabel="Quitar el filtro de municipio"
                    placement="bottom"
                    className={CERRAR_DEBAJO}
                />
            )}

            {abierto && (
                <div className={`absolute top-full right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 mt-2 w-80 max-w-[calc(100vw-2rem)] max-h-[min(32rem,calc(100dvh-7rem))] flex flex-col z-50 rounded-[14px] ${PANEL_SHADOW}`}>
                    <MunicipioFilterPanel municipioMode={municipio} onClose={() => setAbierto(false)} />
                </div>
            )}
        </div>
    );
};

export default CatalogoMunicipioPill;
