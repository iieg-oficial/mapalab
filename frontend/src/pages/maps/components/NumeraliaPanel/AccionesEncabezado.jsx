import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';

const MODOS = [
    { clave: 'comparar', icono: 'comparar', titulo: 'Comparar municipios', etiqueta: 'Comparar estadísticas entre municipios' },
    { clave: 'ranking', icono: 'ranking', titulo: 'Ranking estatal', etiqueta: 'Ver el ranking de los municipios' },
    { clave: 'crear', icono: 'crear', titulo: 'Crear estadística', etiqueta: 'Armar una estadística propia' },
];

const Boton = ({ activo, onClick, titulo, etiqueta, children }) => (
    <Tooltip content={titulo}>
        <button
            type="button"
            onClick={onClick}
            aria-pressed={activo}
            aria-label={etiqueta}
            className={`size-6 flex items-center justify-center rounded-full transition cursor-pointer ${activo ? 'bg-purple text-white' : 'text-purple hover:bg-purple hover:text-white'}`}
        >
            {children}
        </button>
    </Tooltip>
);

const AccionesEncabezado = ({ modo, onModo, dinamica, onMinimizar, onCerrar }) => (
    <div className="flex items-center gap-1 shrink-0">
        {dinamica && MODOS.map(item => (
            <Boton
                key={item.clave}
                activo={modo === item.clave}
                onClick={() => onModo(item.clave)}
                titulo={modo === item.clave ? 'Volver al resumen' : item.titulo}
                etiqueta={modo === item.clave ? 'Volver al resumen de estadísticas' : item.etiqueta}
            >
                <Icon name={item.icono} className="size-3.5" />
            </Boton>
        ))}

        {dinamica && <span className="w-px h-3 bg-[#DCE3F0] mx-0.5" />}

        <Tooltip content="Minimizar estadísticas">
            <button
                type="button"
                onClick={onMinimizar}
                aria-expanded="true"
                className="size-6 flex items-center justify-center rounded-full text-purple hover:bg-purple hover:text-white transition cursor-pointer"
                aria-label="Minimizar el panel de estadísticas"
            >
                <span className="block w-2.5 h-[2px] bg-current rounded-full" />
            </button>
        </Tooltip>

        <Tooltip content="Cerrar estadísticas">
            <button
                type="button"
                onClick={onCerrar}
                className="size-6 flex items-center justify-center rounded-full text-purple hover:bg-purple hover:text-white transition cursor-pointer"
                aria-label="Cerrar el panel de estadísticas"
            >
                <Icon name="close" className="size-3.5" />
            </button>
        </Tooltip>
    </div>
);

export default AccionesEncabezado;
