import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { Encabezado } from './ResumenLados';

const Columna = ({ lado, layerId, metadata }) => {
    const slots = (metadata?.numeralia || []).filter(s => s.nombre && s.valor);
    return (
        <div className="flex flex-col gap-1.5 min-w-[180px]">
            <span className="flex items-center gap-2 min-w-0">
                <Encabezado lado={lado} periodo={metadata?.ambito?.temporal} cargando={!metadata} capa={layerId} />
                <span className="text-[11px]/[14px] font-garet font-bold text-[#2E4372] truncate">{metadata?.nombre_capa_usuario}</span>
            </span>
            <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 items-center">
                {slots.map(slot => (
                    <div key={slot.nombre} className="contents">
                        <dt className="text-[11px]/[14px] font-garet text-[#465055]">{slot.nombre}</dt>
                        <dd className="text-right font-garet text-[15px]/[22px] font-bold tabular-nums whitespace-nowrap text-[#191919]">
                            {`${formatNumber(String(slot.valor))}${slot.simbolo ? ` ${slot.simbolo}` : ''}`}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
};

const ResumenCapas = ({ layerId, lado, metadata, capaOtra }) => {
    const columnas = {
        [lado]: { layerId, metadata },
        [capaOtra.lado]: { layerId: capaOtra.id, metadata: capaOtra.metadata },
    };
    return (
        <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1 max-md:gap-4">
            <Columna lado="A" {...columnas.A} />
            <Columna lado="B" {...columnas.B} />
        </div>
    );
};

export default ResumenCapas;
