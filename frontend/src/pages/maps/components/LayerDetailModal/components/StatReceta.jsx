const Eslabon = ({ titulo, children, destacado = false }) => (
    <div className={`rounded-lg border px-2 py-1 leading-tight ${destacado ? 'bg-[#EFF3FC] border-[#5C2472]' : 'bg-white border-[#E2E8F4]'}`}>
        <span className="block text-[8px] uppercase tracking-wider font-bold text-[#5C2472]">{titulo}</span>
        {children}
    </div>
);

const Union = ({ signo = '↓' }) => (
    <span className="text-[#5C2472] font-bold text-[10px] leading-none pl-2.5" aria-hidden="true">{signo}</span>
);

const Cadena = ({ receta, valor, simbolo }) => (
    <div className="flex flex-col gap-0.5 text-[10px] text-[#465055]">
        <Eslabon titulo="Origen">{receta.origen}</Eslabon>
        {receta.filtros.map((f, i) => (
            <span key={i} className="contents">
                <Union />
                <Eslabon titulo={f.delContexto ? 'Filtro del visor' : 'Filtro'}>
                    {f.campo} {f.operador} {f.valor ?? ''}
                </Eslabon>
            </span>
        ))}
        <Union />
        <Eslabon titulo="Operación">
            {receta.operacion}{receta.columna ? ` ${receta.columna}` : ''}
        </Eslabon>
        <Union signo="=" />
        <Eslabon titulo="Resultado" destacado>
            <strong className="text-[13px] text-[#5C2472] tabular-nums">{valor}{simbolo ? ` ${simbolo}` : ''}</strong>
        </Eslabon>
    </div>
);

const StatReceta = ({ receta, valor, simbolo }) => {
    if (!receta) return null;

    if (receta.tipo !== 'primitiva') {
        return (
            <div className="rounded-[10px] border border-[#E2E8F4] bg-white px-3 py-2 text-[11px] text-[#465055]">
                {receta.operacion}
            </div>
        );
    }

    return (
        <div className="rounded-[10px] border border-[#E2E8F4] bg-white px-3 py-2.5">
            <Cadena receta={receta} valor={valor} simbolo={simbolo} />
            {receta.omitidos?.length > 0 && (
                <p className="mt-2 text-[10px] leading-snug text-[#465055]">
                    Sin filtro de {receta.omitidos.join(' ni ')}: la cifra es de todo el estado y todo el periodo.
                </p>
            )}
        </div>
    );
};

export default StatReceta;
