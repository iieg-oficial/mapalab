import Icon from '@components/Icon';
import ActionIconButton from '@components/ActionIconButton';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';

const VentanaBarra = ({ nombre, oculta, esGrupo, hojasDelGrupo, datos, verCql, onAlternarCql, onCerrar, arrastre }) => {
    const { alternarMinimizado } = useTablaAtributos();
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
                    <span
                        title={`Es un grupo: la tabla trae los datos de sus ${hojasDelGrupo} capas juntas`}
                        className="shrink-0 h-5 px-1.5 flex items-center rounded-full bg-[#EAEFFA] text-[10px]/[13px] font-garet text-[#6B7585]"
                    >
                        grupo · {hojasDelGrupo}
                    </span>
                )}
            </div>

            <div className="ml-auto flex items-center gap-1 shrink-0">
                {datos.disponible && (
                    <>
                        <ActionIconButton
                            onClick={vista.alternarSeguimiento}
                            activo={siguiendo}
                            titulo="Solo lo que abarca el mapa"
                            etiqueta="Mostrar solo lo que abarca el mapa"
                            tamano="sm"
                        >
                            <Icon name="recorte" className="size-3.5" />
                        </ActionIconButton>

                        {(siguiendo || congelada) && (
                            <ActionIconButton
                                onClick={congelada ? vista.descongelar : vista.congelar}
                                activo={congelada}
                                titulo={congelada ? 'Descongelar el recorte' : 'Congelar el recorte actual'}
                                etiqueta={congelada ? 'Descongelar el recorte' : 'Congelar el recorte actual'}
                                tamano="sm"
                            >
                                <Icon name={congelada ? 'play' : 'pause'} className="size-3.5" />
                            </ActionIconButton>
                        )}

                        <ActionIconButton
                            onClick={onAlternarCql}
                            activo={verCql}
                            titulo="Ver la consulta como CQL"
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
                    titulo="Cerrar la tabla"
                    etiqueta={`Cerrar la tabla de ${nombre}`}
                    tamano="sm"
                >
                    <Icon name="close" className="size-3.5" />
                </ActionIconButton>
            </div>
        </div>
    );
};

export default VentanaBarra;
