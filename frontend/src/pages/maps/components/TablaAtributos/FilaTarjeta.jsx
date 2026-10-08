import { formatearValor } from '@pages/maps/helpers/tablaFormato';

const FilaTarjeta = ({ columnas, feature, activa, onSeleccionar }) => {
    const propiedades = feature?.properties || {};
    const [principal, ...resto] = columnas;

    return (
        <button
            type="button"
            onClick={() => onSeleccionar(feature)}
            className={`w-full text-left px-3 py-2.5 border-b border-[#EAEFFA] cursor-pointer ${activa ? 'bg-purple-soft' : ''}`}
        >
            <span className={`block text-[13px] font-garet font-bold truncate ${activa ? 'text-purple' : 'text-graphite'}`}>
                {principal ? formatearValor(propiedades[principal.nombre], principal.formato) : '—'}
            </span>
            <span className="block mt-0.5 text-[11px] font-garet text-[#6B7585] truncate">
                {resto.slice(0, 3)
                    .map(columna => `${columna.etiqueta}: ${formatearValor(propiedades[columna.nombre], columna.formato)}`)
                    .join(' · ')}
            </span>
        </button>
    );
};

export default FilaTarjeta;
