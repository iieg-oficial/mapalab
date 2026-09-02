import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import ActionIconButton from '@components/ActionIconButton';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';
import SelectorColumnas from './SelectorColumnas';

const VentanaBarra = ({ nombre, oculta, esGrupo, hojasDelGrupo, layerId, datos, verCql, onAlternarCql, onCerrar, arrastre }) => {
    const { alternarMinimizado, alternarColumna, mostrarTodasLasColumnas } = useTablaAtributos();
    const { vista } = datos;
    const siguiendo = vista.vista === 'visible';
    const congelada = vista.vista === 'congelada';

    return (
        <div
            {...(arrastre || {})}
            className={`px-3 pt-1.5 pb-1.5 flex items-center justify-between gap-3 shrink-0 bg-white ${arrastre ? 'cursor-move touch-none' : ''}`}
        >
            <div className="min-w-0 flex items-center gap-2">
                <Icon name="tabla" className="size-4 shrink-0 text-purple" />
                <h3
                    title={oculta ? `${nombre} (oculta en el mapa)` : nombre}
                    className={`font-garet font-bold text-[18px]/[28px] text-purple tracking-normal truncate ${oculta ? 'opacity-50' : ''}`}
                >
                    {nombre}
                </h3>
                {esGrupo && hojasDelGrupo > 1 && (
                    <Tooltip
                        content={`Esta capa es un grupo de ${hojasDelGrupo} capas que comparten la misma tabla. Aquí ves los registros de todas juntas, sin el filtro que separa a cada una en el mapa`}
                        placement="bottom"
                        delay={300}
                    >
                        <span className="shrink-0 h-5 px-1.5 flex items-center rounded-full bg-[#EAEFFA] text-[10px]/[13px] font-garet text-[#6B7585] cursor-help">
                            grupo · {hojasDelGrupo}
                        </span>
                    </Tooltip>
                )}
            </div>

            <div className="ml-auto flex items-center gap-1 shrink-0">
                {datos.disponible && (
                    <>
                        <SelectorColumnas
                            columnas={datos.columnas}
                            ocultas={datos.ocultas}
                            onAlternar={columna => alternarColumna(layerId, columna)}
                            onMostrarTodas={() => mostrarTodasLasColumnas(layerId)}
                        />

                        <ActionIconButton
                            onClick={vista.alternarSeguimiento}
                            activo={siguiendo || congelada}
                            titulo="Solo lo que cabe en la pantalla: la tabla muestra únicamente los registros dentro de lo que abarca el mapa, y se vuelve a consultar cada vez que lo mueves o le haces zoom"
                            etiqueta="Mostrar solo los registros que caben en la pantalla del mapa"
                            tamano="sm"
                        >
                            <Icon name="recorte" className="size-3.5" />
                        </ActionIconButton>

                        {(siguiendo || congelada) && (
                            <ActionIconButton
                                onClick={congelada ? vista.descongelar : vista.congelar}
                                activo={congelada}
                                titulo={congelada
                                    ? 'Recorte fijo: la tabla dejó de seguir al mapa y conserva los registros del área que fijaste. Tócalo para volver a seguir al mapa'
                                    : 'Fijar el área actual: la tabla deja de seguir al mapa, así puedes moverte y hacer zoom sin que cambien los registros de la lista'}
                                etiqueta={congelada ? 'Volver a seguir al mapa' : 'Fijar el área actual'}
                                tamano="sm"
                            >
                                <Icon name="pause" className="size-3.5" />
                            </ActionIconButton>
                        )}

                        <ActionIconButton
                            onClick={onAlternarCql}
                            activo={verCql}
                            titulo="Ver y editar la consulta como expresión CQL, que es el filtro que se le manda al servicio"
                            etiqueta="Ver la consulta como CQL"
                            tamano="sm"
                        >
                            <Icon name="text" className="size-3.5" />
                        </ActionIconButton>
                    </>
                )}

                <span className="w-px h-3 bg-[#DCE3F0] mx-0.5" />

                <ActionIconButton
                    onClick={alternarMinimizado}
                    titulo="Minimizar la tabla"
                    etiqueta="Minimizar la tabla de datos"
                    tamano="sm"
                >
                    <span className="block w-2.5 h-[2px] bg-current rounded-full" />
                </ActionIconButton>

                <ActionIconButton
                    onClick={onCerrar}
                    titulo="Cerrar la tabla de datos"
                    etiqueta="Cerrar la herramienta de tabla de datos"
                    tamano="sm"
                >
                    <Icon name="close" className="size-3.5" />
                </ActionIconButton>
            </div>
        </div>
    );
};

export default VentanaBarra;
