import Checkbox from '@components/Checkbox';
import Tooltip from '@components/Tooltip';
import { BOTON_ICONO, BOTON_ICONO_PELIGRO, ERROR, INPUT, INPUT_ERROR, SELECT, TEXTAREA, chip } from '../../helpers/controles';
import { MAX_ETIQUETA, MAX_PARRAFO } from '../../helpers/tarjetaModelo';
import { EditorCombinado, SelectorCampo } from './SelectorCampo';
import { IconoAbajo, IconoAlerta, IconoArriba, IconoBasura, IconoLink } from './iconos';

const modoDe = (tipo, item) => {
    if (item.compose) return 'combinar';
    if (tipo === 'text' && !item.field) return 'fijo';
    return 'campo';
};

const primerCampo = (compose) => {
    const parte = (compose || [])[0];
    return typeof parte === 'string' ? parte : parte?.field || null;
};

const cambioDeModo = (item, modo) => {
    if (modo === 'campo') return { field: item.field || primerCampo(item.compose), compose: undefined, sep: undefined, op: undefined };
    if (modo === 'combinar') return { compose: item.compose || (item.field ? [{ field: item.field }] : []), field: undefined };
    return { field: undefined, compose: undefined, sep: undefined };
};

const Opcion = ({ activa, onCambio, texto }) => (
    <span className="inline-flex items-center gap-2 font-garet text-[12px] text-[#465055]">
        <Checkbox checked={!!activa} onChange={onCambio} />
        {texto}
    </span>
);

const FilaEditor = ({ tipo, item, columnas, problema, primero, ultimo, onCambio, onQuitar, onMover }) => {
    const modo = modoDe(tipo, item);
    const modos = tipo === 'text' ? ['campo', 'combinar', 'fijo'] : ['campo', 'combinar'];
    const nombres = { campo: 'Campo', combinar: 'Combinar', fijo: 'Texto fijo' };
    const base = `fila-${item.uid}`;

    return (
        <div className="flex flex-col gap-2.5 p-3 rounded-[10px] bg-[#FAFAFC]">
            <div className="flex items-center gap-1.5">
                <div role="radiogroup" aria-label="Qué muestra esta fila" className="flex flex-wrap gap-1.5 flex-1">
                    {modos.map((m) => (
                        <button
                            key={m}
                            type="button"
                            role="radio"
                            aria-checked={modo === m}
                            onClick={() => modo !== m && onCambio(cambioDeModo(item, m))}
                            className={chip(modo === m)}
                        >
                            {nombres[m]}
                        </button>
                    ))}
                </div>
                {item.href && (
                    <Tooltip content="Conserva el link que ya tenía" placement="top" delay={200}>
                        <span className="size-8 flex items-center justify-center text-[#5C2472]"><IconoLink /></span>
                    </Tooltip>
                )}
                <button type="button" onClick={() => onMover(-1)} disabled={primero} aria-label="Subir fila" className={BOTON_ICONO}><IconoArriba /></button>
                <button type="button" onClick={() => onMover(1)} disabled={ultimo} aria-label="Bajar fila" className={BOTON_ICONO}><IconoAbajo /></button>
                <button type="button" onClick={onQuitar} aria-label="Quitar fila" className={BOTON_ICONO_PELIGRO}><IconoBasura /></button>
            </div>

            {modo === 'campo' && (
                <SelectorCampo id={`${base}-campo`} valor={item.field} columnas={columnas} onCambio={(field) => onCambio({ field })} error={!!problema && !item.field} />
            )}
            {modo === 'combinar' && (
                <EditorCombinado id={`${base}-combinar`} compose={item.compose} sep={item.sep} columnas={columnas} onCambio={onCambio} error={!!problema} />
            )}
            {modo === 'fijo' ? (
                <textarea
                    value={item.label || ''}
                    onChange={(e) => onCambio({ label: e.target.value.slice(0, MAX_PARRAFO) })}
                    placeholder="Escribe el texto"
                    aria-label="Texto fijo"
                    className={`${TEXTAREA} ${problema ? INPUT_ERROR : ''}`}
                />
            ) : (
                <input
                    value={item.label || ''}
                    onChange={(e) => onCambio({ label: e.target.value.slice(0, MAX_ETIQUETA) })}
                    placeholder={tipo === 'text' ? 'Etiqueta (opcional)' : 'Cómo se llama para quien consulta'}
                    aria-label="Nombre en la tarjeta"
                    className={`${INPUT} ${problema && tipo !== 'text' && !String(item.label || '').trim() ? INPUT_ERROR : ''}`}
                />
            )}

            {tipo === 'cards' ? (
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        value={item.suffix || ''}
                        onChange={(e) => onCambio({ suffix: e.target.value.slice(0, 12) || undefined })}
                        placeholder="Unidad (ej. ha)"
                        aria-label="Unidad"
                        className={`${INPUT} w-36!`}
                    />
                    <div className="relative w-44">
                        <select
                            value={item.decimals ?? ''}
                            onChange={(e) => onCambio({ decimals: e.target.value === '' ? undefined : Number(e.target.value) })}
                            aria-label="Decimales"
                            className={SELECT}
                        >
                            <option value="">Decimales: auto</option>
                            {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{`${n} decimales`}</option>)}
                        </select>
                        <IconoAbajo className="size-4 absolute right-3 top-3 pointer-events-none text-[#5C2472]" />
                    </div>
                    {modo === 'combinar' && (
                        <Opcion activa={item.op === 'sum'} onCambio={() => onCambio({ op: item.op === 'sum' ? undefined : 'sum' })} texto="Sumar los campos" />
                    )}
                </div>
            ) : modo !== 'fijo' && (
                <Opcion
                    activa={item.formato === 'anio'}
                    onCambio={() => onCambio({ formato: item.formato === 'anio' ? undefined : 'anio' })}
                    texto="Mostrar solo el año"
                />
            )}

            {problema && <p className={ERROR}><IconoAlerta className="size-3.5 shrink-0" />{problema}</p>}
        </div>
    );
};

export default FilaEditor;
