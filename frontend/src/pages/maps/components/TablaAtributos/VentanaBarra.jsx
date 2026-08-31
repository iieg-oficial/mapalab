import { useTablaAtributos } from '@contexts/TablaAtributosContext';

const BOTON = 'h-6 px-2 rounded-full border text-[11px] font-garet cursor-pointer whitespace-nowrap';

const VentanaBarra = ({ nombre, datos, verCql, onAlternarCql, onCerrar, arrastre }) => {
    const { alternarMinimizado } = useTablaAtributos();
    const { vista } = datos;
    const siguiendo = vista.vista === 'visible';
    const congelada = vista.vista === 'congelada';

    return (
        <div
            {...(arrastre || {})}
            className={`h-9 px-2.5 flex items-center gap-2 bg-[#F5F7FC] border-b border-[#DCE3F0] ${arrastre ? 'cursor-move touch-none' : ''}`}
        >
            <span className="text-[12px] font-garet font-bold text-purple truncate">{nombre}</span>

            {datos.disponible && (
                <>
                    <button
                        type="button"
                        onClick={vista.alternarSeguimiento}
                        aria-pressed={siguiendo}
                        title="La tabla solo muestra lo que abarca el mapa"
                        className={`${BOTON} ${siguiendo ? 'border-purple-deep bg-purple-soft text-purple' : 'border-[#DCE3F0] text-graphite hover:border-purple'}`}
                    >
                        Solo lo visible
                    </button>

                    {(siguiendo || congelada) && (
                        <button
                            type="button"
                            onClick={congelada ? vista.descongelar : vista.congelar}
                            title="Fija el recorte actual para poder navegar sin que la tabla cambie"
                            className={`${BOTON} ${congelada ? 'border-orange text-orange' : 'border-[#DCE3F0] text-graphite hover:border-purple'}`}
                        >
                            {congelada ? 'Descongelar' : 'Congelar'}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onAlternarCql}
                        aria-pressed={verCql}
                        className={`${BOTON} ${verCql ? 'border-purple-deep bg-purple-soft text-purple' : 'border-[#DCE3F0] text-graphite hover:border-purple'}`}
                    >
                        Ver como CQL
                    </button>
                </>
            )}

            <span className="ml-auto flex items-center gap-1">
                <button
                    type="button"
                    onClick={alternarMinimizado}
                    aria-label="Minimizar la tabla"
                    className="size-6 flex items-center justify-center rounded-full text-[12px] text-graphite hover:text-purple cursor-pointer"
                >
                    ▾
                </button>
                <button
                    type="button"
                    onClick={onCerrar}
                    aria-label={`Cerrar la tabla de ${nombre}`}
                    className="size-6 flex items-center justify-center rounded-full text-[12px] text-graphite hover:text-purple cursor-pointer"
                >
                    ✕
                </button>
            </span>
        </div>
    );
};

export default VentanaBarra;
