import { useState } from 'react';
import Tooltip from '@components/Tooltip';
import { useFeatureSeen } from '@hooks/useFeatureSeen';
import { useDecoracionEvento } from '@hooks/useEvento';
import { TEMA_DIA_DE_MUERTOS } from '@pages/maps/helpers/eventoDiversion';
import PanDeMuerto from './PanDeMuerto';

const BotonDiaDeMuertos = ({ sizeClass = 'size-7', avisoPlacement = 'right' }) => {
    const { tema, slug, activa, alternar } = useDecoracionEvento();
    const disponible = tema === TEMA_DIA_DE_MUERTOS;
    const [avisoVisto, marcarAvisoVisto] = useFeatureSeen(disponible ? `decoracion-aviso:${slug}` : null);
    const [avisoCerrado, setAvisoCerrado] = useState(false);

    if (!disponible) return null;

    const mostrarAviso = !avisoVisto && !avisoCerrado;
    const etiqueta = activa ? 'Quitar Día de Muertos' : 'Activar Día de Muertos';

    const handleClick = () => {
        marcarAvisoVisto();
        alternar();
    };

    return (
        <Tooltip
            content={activa ? 'Quitar Día de Muertos' : '¡Día de Muertos!'}
            placement={avisoPlacement}
            forceVisible={mostrarAviso}
            delay={200}
        >
            <button
                type="button"
                onClick={handleClick}
                onMouseEnter={() => setAvisoCerrado(true)}
                aria-label={etiqueta}
                aria-pressed={activa}
                className={`${sizeClass} rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer drop-shadow-[0_2px_3px_#1A266433]`}
            >
                <PanDeMuerto mordido={activa} className="size-full" />
            </button>
        </Tooltip>
    );
};

export default BotonDiaDeMuertos;
