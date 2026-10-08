import Bar from '@components/Bar';

const Map3DDeslizador = ({ titulo, valor, texto, min, max, step, onChange }) => {
    const inputId = `view3d-${titulo.toLowerCase().replace(/\s+/g, '-')}`;
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={inputId} className="flex justify-between font-garet text-[12px] text-graphite">
                {titulo}
                <span className="font-bold tabular-nums">{texto}</span>
            </label>
            <Bar
                id={inputId}
                min={min}
                max={max}
                step={step}
                value={valor}
                onChange={(event) => onChange(Number(event.target.value))}
                aria-label={titulo}
            />
        </div>
    );
};

export default Map3DDeslizador;
