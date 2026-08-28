import Icon from '@components/Icon';
import { operadoresDe } from '@hooksMaps/useStatsBuilder';

export const Paso = ({ numero, activo = true, children }) => (
    <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`size-3.5 shrink-0 rounded-full grid place-items-center text-[8px]/[8px] font-bold ${activo ? 'bg-purple text-white' : 'bg-[#D6DEEE] text-[#6E7B96]'}`}>
            {numero}
        </span>
        {children}
    </div>
);

export const Texto = ({ children }) => (
    <span className="text-[10px]/[13px] text-[#8894AE] font-garet">{children}</span>
);

export const Campo = ({ valor, onCambio, opciones, etiqueta, ancho = 'w-32' }) => (
    <select
        value={valor ?? ''}
        onChange={(evento) => onCambio(evento.target.value)}
        aria-label={etiqueta}
        className={`${ancho} rounded-md border border-[#DDE4F2] bg-white px-1.5 py-0.5 text-[10px]/[14px] text-[#2E4372] outline-none focus:border-purple cursor-pointer truncate`}
    >
        {opciones.map(opcion => (
            <option key={opcion.valor} value={opcion.valor}>{opcion.texto}</option>
        ))}
    </select>
);

const ValorDeFiltro = ({ filtro, campo, onCambio }) => {
    if (filtro.op === 'is_not_null') return null;

    if (campo?.tipo === 'texto' && campo.valores?.length) {
        return (
            <Campo
                etiqueta="Valor"
                valor={filtro.value ?? ''}
                onCambio={(v) => onCambio({ value: v })}
                opciones={[
                    { valor: '', texto: 'elige…' },
                    ...campo.valores.map(v => ({ valor: v, texto: v })),
                ]}
            />
        );
    }

    return (
        <input
            type={campo?.tipo === 'fecha' ? 'date' : 'number'}
            value={filtro.value ?? ''}
            onChange={(evento) => onCambio({ value: evento.target.value })}
            aria-label="Valor"
            className="w-24 rounded-md border border-[#DDE4F2] bg-white px-1.5 py-0.5 text-[10px]/[14px] text-[#2E4372] outline-none focus:border-purple"
        />
    );
};

const ConstructorFila = ({ numero, filtro, campos, onCambio, onQuitar }) => {
    const campo = campos.find(c => c.nombre === filtro.field);
    const operadores = operadoresDe(campo?.tipo);

    const cambiarCampo = (nombre) => {
        const siguiente = campos.find(c => c.nombre === nombre);
        onCambio({ field: nombre, op: operadoresDe(siguiente?.tipo)[0].clave, value: null });
    };

    return (
        <Paso numero={numero}>
            <Texto>{numero === 2 ? 'donde' : 'y'}</Texto>
            <Campo
                etiqueta="Columna"
                valor={filtro.field ?? ''}
                onCambio={cambiarCampo}
                opciones={[
                    { valor: '', texto: 'elige columna…' },
                    ...campos.map(c => ({ valor: c.nombre, texto: c.nombre })),
                ]}
            />
            <Campo
                etiqueta="Comparación"
                ancho="w-24"
                valor={filtro.op}
                onCambio={(v) => onCambio({ op: v })}
                opciones={operadores.map(o => ({ valor: o.clave, texto: o.texto }))}
            />
            <ValorDeFiltro filtro={filtro} campo={campo} onCambio={onCambio} />
            <button
                type="button"
                onClick={onQuitar}
                aria-label="Quitar esta condición"
                className="text-[#A9B4CC] hover:text-purple transition cursor-pointer"
            >
                <Icon name="close" className="size-2.5" />
            </button>
        </Paso>
    );
};

export default ConstructorFila;
