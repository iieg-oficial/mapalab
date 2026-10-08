import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';

const CatalogoTablaButton = ({ layerId, disponible, hayCapa }) => {
    const { activo, abrir, cerrarTodas } = useTablaAtributos();
    const abierta = activo && disponible;

    const titulo = !hayCapa
        ? 'Elige una capa para ver su tabla de datos'
        : !disponible
            ? 'Esta capa no publica una tabla de datos'
            : abierta ? 'Cerrar la tabla de datos' : 'Ver la tabla de datos';

    return (
        <Tooltip content={titulo} placement="right" delay={300}>
            <button
                type="button"
                onClick={() => {
                    if (!disponible) return;
                    if (abierta) cerrarTodas();
                    else abrir(layerId);
                }}
                aria-disabled={!disponible}
                aria-pressed={abierta}
                aria-label={titulo}
                className={[
                    'size-10 rounded-full flex items-center justify-center shadow-[0_5px_20px_#1A26641A] transition-colors',
                    !disponible
                        ? 'bg-white text-[#C9C4D1] cursor-not-allowed'
                        : abierta
                            ? 'bg-purple text-white hover:bg-purple-deep cursor-pointer'
                            : 'bg-white text-graphite hover:bg-purple-soft cursor-pointer',
                ].join(' ')}
            >
                <Icon name="tabla" className="size-5 shrink-0" />
            </button>
        </Tooltip>
    );
};

export default CatalogoTablaButton;
