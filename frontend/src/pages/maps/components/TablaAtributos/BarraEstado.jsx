import ChipsFiltro from './ChipsFiltro';
import PestanasTablas from './PestanasTablas';

const BarraEstado = ({ nombreDe, chips, vista, onQuitarChip, onLimpiarChips, inferior }) => (
    <div className="fixed left-0 right-0 z-11 px-3 flex justify-center pointer-events-none" style={{ bottom: inferior }}>
        <div className="max-w-full flex flex-col items-center gap-2">
            {chips.length > 0 && (
                <div className="max-w-full flex items-center gap-1.5 px-3 h-9 rounded-full bg-white shadow-[0_5px_20px_#1A26641A] border border-[#EAEFFA] overflow-x-auto scrollbar-thin pointer-events-auto">
                    <ChipsFiltro chips={chips} onQuitar={onQuitarChip} onLimpiar={onLimpiarChips} compacto />
                    {vista !== 'libre' && (
                        <span className="shrink-0 h-6 px-2 flex items-center rounded-full border border-[#EAEFFA] text-[11px] font-garet text-[#8894AE]">
                            {vista === 'congelada' ? 'recorte congelado' : 'solo lo visible'}
                        </span>
                    )}
                </div>
            )}
            <PestanasTablas nombreDe={nombreDe} tamano="normal" />
        </div>
    </div>
);

export default BarraEstado;
