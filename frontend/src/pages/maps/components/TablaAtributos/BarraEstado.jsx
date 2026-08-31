import { useTablaAtributos } from '@contexts/TablaAtributosContext';
import ChipsFiltro from './ChipsFiltro';

const formatoConteo = (conteo) => (Number.isFinite(conteo) ? conteo.toLocaleString('es-MX') : '…');

const BarraEstado = ({ nombreDe, chips, vista, onQuitarChip, onLimpiarChips, inferior }) => {
    const { tablas, activaId, minimizado, activar, cerrar, alternarMinimizado, estadoDe } = useTablaAtributos();

    if (tablas.length === 0) return null;

    return (
        <div
            className="fixed left-0 right-0 z-11 px-2 pointer-events-none"
            style={{ bottom: inferior }}
        >
            <div className="mx-auto max-w-5xl h-9 px-2 flex items-center gap-2 rounded-[10px] bg-white shadow-[0_5px_20px_#1A26641A] border border-[#EAEFFA] pointer-events-auto">
                <div className="flex items-center gap-1 shrink-0 max-w-[45%] overflow-x-auto scrollbar-thin">
                    {tablas.map(layerId => {
                        const activa = layerId === activaId;
                        const { conteo } = estadoDe(layerId);
                        return (
                            <span key={layerId} className="flex items-center shrink-0">
                                <button
                                    type="button"
                                    onClick={() => activar(layerId)}
                                    aria-pressed={activa}
                                    className={`h-6 px-2 flex items-center gap-1.5 rounded-full border text-[11px] font-garet cursor-pointer ${activa ? 'border-purple-deep bg-purple-soft text-purple font-bold' : 'border-[#DCE3F0] text-graphite hover:border-purple'}`}
                                >
                                    <span className="max-w-32 truncate">{nombreDe(layerId)}</span>
                                    <span className="tabular-nums opacity-80">{formatoConteo(conteo)}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => cerrar(layerId)}
                                    aria-label={`Cerrar la tabla de ${nombreDe(layerId)}`}
                                    className="size-5 ml-0.5 flex items-center justify-center rounded-full text-[10px] text-[#8A94A6] hover:text-purple cursor-pointer"
                                >
                                    ✕
                                </button>
                            </span>
                        );
                    })}
                </div>

                <span className="w-px h-4 bg-[#DCE3F0] shrink-0" aria-hidden="true" />

                <div className="flex-1 min-w-0 overflow-x-auto scrollbar-thin">
                    <ChipsFiltro chips={chips} onQuitar={onQuitarChip} onLimpiar={onLimpiarChips} compacto />
                </div>

                {vista !== 'libre' && (
                    <span className="shrink-0 h-6 px-2 flex items-center rounded-full border border-[#DCE3F0] text-[11px] font-garet text-graphite">
                        {vista === 'congelada' ? 'recorte congelado' : 'solo lo visible'}
                    </span>
                )}

                <button
                    type="button"
                    onClick={alternarMinimizado}
                    className="shrink-0 size-6 flex items-center justify-center rounded-full text-[12px] text-graphite hover:text-purple cursor-pointer"
                    aria-label={minimizado ? 'Abrir la tabla' : 'Minimizar la tabla'}
                >
                    {minimizado ? '▴' : '▾'}
                </button>
            </div>
        </div>
    );
};

export default BarraEstado;
