import { useState } from 'react';
import Header from '@pages/maps/components/InfoBox/components/Header';
import { PINTORES } from '@pages/maps/components/InfoBox/utils/cardBlocks.jsx';
import { chip } from '../../helpers/controles';
import { esEditable } from '../../helpers/tarjetaFusion';
import { NOMBRE_BLOQUE } from './constantes';
import { IconoMas } from './iconos';

const Seccion = ({ activa, conProblema, etiqueta, onSeleccionar, children }) => (
    <div
        role="button"
        tabIndex={0}
        aria-pressed={activa}
        aria-label={`Editar ${etiqueta}`}
        onClick={onSeleccionar}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSeleccionar();
            }
        }}
        className={`relative rounded-lg outline-2 outline-offset-2 cursor-pointer transition-colors ${activa
            ? 'outline-[#FF8300]'
            : conProblema
                ? 'outline-[#EA4336]'
                : 'outline-transparent hover:outline-dashed hover:outline-[#FF8300]/70 focus-visible:outline-[#FF8300]'}`}
    >
        {children}
    </div>
);

const Vacio = ({ texto }) => (
    <p className="py-3 text-center font-garet text-[12px] text-[#A8A2B0]">{texto}</p>
);

const Lienzo = ({ plan, orden, modelo, seleccion, problemas, onSeleccionar, onAgregarBloque, puedeAgregar }) => {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const bloquesPlan = new Map((plan?.blocks || []).map((b) => [b.key, b]));
    const bloquesModelo = new Map(modelo.bloques.map((b) => [b.key, b]));
    const conProblema = (bloque) => bloque.items.some((item) => problemas.porItem[item.uid]);

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="w-[260px] max-w-full bg-white rounded-[10px] shadow-[0px_6px_12px_#2F495C14] flex flex-col p-1.5">
                <Seccion
                    activa={seleccion === 'titulo'}
                    conProblema={!!problemas.titulo}
                    etiqueta="el título"
                    onSeleccionar={() => onSeleccionar('titulo')}
                >
                    <Header value={plan?.title || <span className="text-[#A8A2B0]">Sin título</span>} />
                </Seccion>

                <div className="flex flex-col gap-2 px-2.5 pt-2 pb-1">
                    {orden.map((key) => {
                        const pintado = bloquesPlan.get(key);
                        const cuerpo = pintado ? PINTORES[pintado.type]?.({ block: pintado, variant: 'desktop', onAction: null }) : null;
                        if (!esEditable(key)) return cuerpo ? <div key={key}>{cuerpo}</div> : null;
                        const bloque = bloquesModelo.get(key);
                        if (!bloque) return null;
                        return (
                            <Seccion
                                key={key}
                                activa={seleccion === key}
                                conProblema={conProblema(bloque)}
                                etiqueta={NOMBRE_BLOQUE[bloque.tipo]}
                                onSeleccionar={() => onSeleccionar(key)}
                            >
                                {cuerpo || <Vacio texto={`${NOMBRE_BLOQUE[bloque.tipo]}: sin datos en este registro`} />}
                            </Seccion>
                        );
                    })}
                </div>
            </div>

            {menuAbierto ? (
                <div role="group" aria-label="Agregar un bloque" className="flex flex-wrap justify-center gap-1.5">
                    {['cards', 'list', 'text'].map((tipo) => (
                        <button
                            key={tipo}
                            type="button"
                            disabled={!puedeAgregar(tipo)}
                            onClick={() => { onAgregarBloque(tipo); setMenuAbierto(false); }}
                            className={chip(false)}
                        >
                            {NOMBRE_BLOQUE[tipo]}
                        </button>
                    ))}
                    <button type="button" onClick={() => setMenuAbierto(false)} className={chip(false)}>Cancelar</button>
                </div>
            ) : (
                <button type="button" onClick={() => setMenuAbierto(true)} className={chip(false)}>
                    <IconoMas className="size-3.5" />Agregar bloque
                </button>
            )}
        </div>
    );
};

export default Lienzo;
