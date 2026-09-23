import { BOTON_CONTORNO, BOTON_ICONO, BOTON_ICONO_PELIGRO } from '../../helpers/controles';
import { MAX_FILAS } from '../../helpers/tarjetaModelo';
import FilaEditor from './FilaEditor';
import { NOMBRE_BLOQUE } from './constantes';
import { IconoAbajo, IconoArriba, IconoBasura, IconoMas } from './iconos';

const PanelBloque = ({ bloque, columnas, problemas, primero, ultimo, acciones }) => {
    const lleno = bloque.items.length >= MAX_FILAS;
    const nuevo = (item) => acciones.agregarItem(bloque.key, item);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
                <h4 className="flex-1 font-garet font-bold text-[15px] text-[#5C2472]">{NOMBRE_BLOQUE[bloque.tipo]}</h4>
                <button type="button" onClick={() => acciones.moverBloque(bloque.key, -1)} disabled={primero} aria-label="Subir el bloque" className={BOTON_ICONO}><IconoArriba /></button>
                <button type="button" onClick={() => acciones.moverBloque(bloque.key, 1)} disabled={ultimo} aria-label="Bajar el bloque" className={BOTON_ICONO}><IconoAbajo /></button>
                <button type="button" onClick={() => acciones.quitarBloque(bloque.key)} aria-label="Quitar el bloque" className={BOTON_ICONO_PELIGRO}><IconoBasura /></button>
            </div>

            {bloque.items.length === 0 && (
                <p className="font-garet text-[12px] text-[#6E7477]">Todavía no tiene filas.</p>
            )}

            {bloque.items.map((item, indice) => (
                <FilaEditor
                    key={item.uid}
                    tipo={bloque.tipo}
                    item={item}
                    columnas={columnas}
                    problema={problemas[item.uid]}
                    primero={indice === 0}
                    ultimo={indice === bloque.items.length - 1}
                    onCambio={(parche) => acciones.actualizarItem(bloque.key, item.uid, parche)}
                    onQuitar={() => acciones.quitarItem(bloque.key, item.uid)}
                    onMover={(delta) => acciones.moverItem(bloque.key, item.uid, delta)}
                />
            ))}

            <div className="flex flex-wrap gap-2">
                <button type="button" disabled={lleno} onClick={() => nuevo({ field: null, label: '' })} className={BOTON_CONTORNO}>
                    <IconoMas />Campo
                </button>
                {bloque.tipo === 'text' && (
                    <button type="button" disabled={lleno} onClick={() => nuevo({ label: '' })} className={BOTON_CONTORNO}>
                        <IconoMas />Texto fijo
                    </button>
                )}
            </div>
            {lleno && <p className="font-garet text-[12px] text-[#6E7477]">{`Máximo ${MAX_FILAS} filas por bloque.`}</p>}
        </div>
    );
};

export default PanelBloque;
