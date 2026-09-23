import Tooltip from '@components/Tooltip';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { SELECCION_TODAS, geometriaDeSeleccion } from './utils/seleccionDescarga';
import { medidasDeSeleccion } from './utils/estadisticasSeleccion';

const km2 = (geometria) => `${formatNumber(medidasDeSeleccion(geometria).areaKm2.toFixed(2))} km²`;

const Opcion = ({ activa, etiqueta, detalle, tooltip, onElegir }) => (
    <Tooltip content={tooltip} placement="left" delay={400} triggerBlock>
        <button
            type="button"
            role="radio"
            aria-checked={activa}
            onClick={onElegir}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left font-garet text-[12px]/[16px] hover:bg-[#EAEFFA] cursor-pointer"
        >
            <span className={`size-3.5 shrink-0 rounded-full border-2 border-purple-deep ${activa ? 'bg-purple-deep shadow-[inset_0_0_0_2px_white]' : ''}`} />
            <span className={`flex-1 ${activa ? 'font-bold text-purple' : 'text-graphite'}`}>{etiqueta}</span>
            <span className="text-[#6E7477] tabular-nums">{detalle}</span>
        </button>
    </Tooltip>
);

const SelectorSeleccion = ({ disponibles, elegida, onElegir }) => {
    if (disponibles.length < 2) return null;

    return (
        <div role="radiogroup" aria-label="Polígono a descargar" className="bg-white rounded-[7px] p-1 max-h-40 overflow-y-auto">
            {[...disponibles].reverse().map(disponible => (
                <Opcion
                    key={disponible.id}
                    activa={elegida === disponible.id}
                    etiqueta={`Polígono ${disponible.numero}`}
                    detalle={km2(disponible.geometry)}
                    tooltip={`Descarga solo el polígono ${disponible.numero}`}
                    onElegir={() => onElegir(disponible.id)}
                />
            ))}
            <Opcion
                activa={elegida === SELECCION_TODAS}
                etiqueta={`Todos (${disponibles.length})`}
                detalle={km2(geometriaDeSeleccion(disponibles, SELECCION_TODAS))}
                tooltip="Descarga todos los polígonos juntos en una sola imagen"
                onElegir={() => onElegir(SELECCION_TODAS)}
            />
        </div>
    );
};

export default SelectorSeleccion;
