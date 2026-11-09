const DetalleAmbito = ({ lado, ambos, modo, ambito, creando }) => (
    <p className="flex items-center gap-1.5 text-[11px]/[13px] font-garet font-bold tracking-normal shrink-0">
        {lado && !ambos && <span className="text-[#8894AE]">Lado {lado}</span>}
        {modo === 'resumen' && <span className="px-2 py-0.5 rounded-full bg-[#F0EAF3] text-purple whitespace-nowrap">{ambito?.geografico || 'Jalisco'}</span>}
        {ambito?.temporal && !creando && !(ambos && modo === 'resumen') && <span className="text-orange">{ambito.temporal}</span>}
    </p>
);

export default DetalleAmbito;
