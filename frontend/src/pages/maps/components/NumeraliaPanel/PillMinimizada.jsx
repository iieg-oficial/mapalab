import { useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';

const PillMinimizada = ({ nombreCapa, onAbrir, onCerrar, anillo, pillRef }) => {
    const [cierreEncima, setCierreEncima] = useState(false);

    return (
        <div ref={pillRef} className="group relative flex min-w-0 pointer-events-auto">
            <Tooltip content="Ver estadísticas" placement="top" delay={300}>
                <button
                    type="button"
                    onClick={onAbrir}
                    aria-expanded="false"
                    aria-label={`Abrir las estadísticas de ${nombreCapa}`}
                    className={`h-10 max-w-full flex items-center gap-2 pl-3 pr-4 rounded-full bg-white shadow-[0_5px_20px_#1A26641A] border border-[#EAEFFA] hover:border-purple transition-all cursor-pointer ${anillo}`}
                >
                    <Icon name="numeralia" className="size-5 shrink-0 text-purple" />
                    <span className="text-[13px]/[16px] font-garet font-bold text-purple tracking-normal whitespace-nowrap truncate max-w-70">
                        {nombreCapa}
                    </span>
                </button>
            </Tooltip>

            <Tooltip
                content="Cerrar estadísticas"
                placement="right"
                delay={300}
                triggerClassName="absolute left-full pl-2 top-1/2 -translate-y-1/2 transition-[opacity,visibility] duration-150 md:invisible md:opacity-0 md:delay-500 md:group-hover:visible md:group-hover:opacity-100 md:group-hover:delay-0 md:group-focus-within:visible md:group-focus-within:opacity-100 md:group-focus-within:delay-0"
            >
                <button
                    type="button"
                    onClick={onCerrar}
                    onMouseEnter={() => setCierreEncima(true)}
                    onMouseLeave={() => setCierreEncima(false)}
                    className={[
                        'size-10 flex items-center justify-center rounded-full border transition-all cursor-pointer shrink-0',
                        cierreEncima ? 'bg-[#FF577D] border-[#FF577D]' : 'bg-[#FFE6EC] border-[#FFE6EC] hover:border-[#FF577D]',
                    ].join(' ')}
                    aria-label="Cerrar el panel de estadísticas"
                >
                    <Icon name="cerrar" state={cierreEncima ? 'hover' : 'normal'} className="size-7" />
                </button>
            </Tooltip>
        </div>
    );
};

export default PillMinimizada;
