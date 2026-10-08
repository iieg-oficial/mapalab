import { useState } from 'react';
import { ERROR, INPUT, INPUT_ERROR, chip } from '../../helpers/controles';
import { MAX_ETIQUETA } from '../../helpers/tarjetaModelo';
import { esTituloFijo } from './constantes';
import { EditorCombinado, SelectorCampo } from './SelectorCampo';
import { IconoAlerta } from './iconos';

const NOMBRES = { campo: 'Campo', fijo: 'Texto fijo', combinar: 'Combinar', ninguno: 'Sin título' };

const modoDe = (titulo, columnas) => {
    if (!titulo) return 'ninguno';
    if (typeof titulo === 'object') return 'combinar';
    return esTituloFijo(titulo, columnas) ? 'fijo' : 'campo';
};

const PanelTitulo = ({ titulo, columnas, problema, onCambio }) => {
    const [elegido, setElegido] = useState(null);
    const modo = elegido === 'fijo' && typeof titulo === 'string' ? 'fijo' : modoDe(titulo, columnas);

    const cambiarModo = (siguiente) => {
        if (siguiente === modo) return;
        setElegido(siguiente);
        if (siguiente === 'ninguno') onCambio(null);
        else if (siguiente === 'combinar') onCambio({ compose: typeof titulo === 'string' && !esTituloFijo(titulo, columnas) ? [{ field: titulo }] : [] });
        else if (siguiente === 'campo') onCambio(columnas?.[0] || null);
        else onCambio('');
    };

    return (
        <div className="flex flex-col gap-3">
            <div role="radiogroup" aria-label="Qué muestra el título" className="flex flex-wrap gap-1.5">
                {['campo', 'fijo', 'combinar', 'ninguno'].map((m) => (
                    <button key={m} type="button" role="radio" aria-checked={modo === m} onClick={() => cambiarModo(m)} className={chip(modo === m)}>
                        {NOMBRES[m]}
                    </button>
                ))}
            </div>
            {modo === 'campo' && (
                <SelectorCampo id="titulo-campo" valor={titulo} columnas={columnas} onCambio={(campo) => onCambio(campo)} />
            )}
            {modo === 'fijo' && (
                <input
                    value={titulo || ''}
                    onChange={(e) => onCambio(e.target.value.slice(0, MAX_ETIQUETA))}
                    placeholder="Escribe el título"
                    aria-label="Título fijo"
                    className={`${INPUT} ${problema ? INPUT_ERROR : ''}`}
                />
            )}
            {modo === 'combinar' && (
                <EditorCombinado id="titulo-combinar" compose={titulo.compose} sep={titulo.sep} columnas={columnas} onCambio={onCambio} />
            )}
            {problema && <p className={ERROR}><IconoAlerta className="size-3.5 shrink-0" />{problema}</p>}
        </div>
    );
};

export default PanelTitulo;
