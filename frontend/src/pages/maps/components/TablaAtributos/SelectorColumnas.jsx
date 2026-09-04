import { useRef, useState } from 'react';
import Icon from '@components/Icon';
import Panel from '@components/Panel';
import Checkbox from '@components/Checkbox';
import ActionIconButton from '@components/ActionIconButton';
import ScrollContainer from '@components/ScrollContainer';

const SelectorColumnas = ({ columnas, ocultas, onAlternar, onMostrarTodas, onOcultarTodas }) => {
    const anclaRef = useRef(null);
    const [abierto, setAbierto] = useState(false);

    const escondidas = ocultas.length;

    return (
        <span ref={anclaRef} className="flex">
            <ActionIconButton
                onClick={() => setAbierto(valor => !valor)}
                activo={escondidas > 0}
                titulo={escondidas > 0
                    ? `${escondidas} ${escondidas === 1 ? 'columna oculta' : 'columnas ocultas'}. Elige cuáles se muestran para que la tabla quepa sin desplazarse`
                    : 'Elegir qué columnas se muestran, para que la tabla quepa sin desplazarse a lo ancho'}
                etiqueta="Elegir las columnas visibles"
                tamano="sm"
            >
                <Icon name="columnas" className="size-3.5" />
            </ActionIconButton>

            <Panel
                open={abierto}
                anchorRef={anclaRef}
                onClose={() => setAbierto(false)}
                placement="bottom-end"
                width="w-60"
                noPadding
                hideHeader
                className="z-50"
            >
                <div className="p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-garet font-bold text-purple">Columnas</span>
                        <span className="flex items-center gap-2">
                            {escondidas > 0 && (
                                <button
                                    type="button"
                                    onClick={onMostrarTodas}
                                    className="text-[11px] font-garet text-[#8A94A6] hover:text-purple cursor-pointer"
                                >
                                    Mostrar todas
                                </button>
                            )}
                            {escondidas < columnas.length && (
                                <button
                                    type="button"
                                    onClick={onOcultarTodas}
                                    className="text-[11px] font-garet text-[#8A94A6] hover:text-purple cursor-pointer"
                                >
                                    Quitar todas
                                </button>
                            )}
                        </span>
                    </div>

                    <ScrollContainer
                        className="max-h-64 flex flex-col gap-1 pr-1 scrollbar-thin scrollbar-thumb-gray-400"
                        hideScrollbar={false}
                        itemCount={columnas.length}
                    >
                        {columnas.map(columna => {
                            const visible = !ocultas.includes(columna.nombre);
                            return (
                                <div
                                    key={columna.nombre}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onAlternar(columna.nombre)}
                                    onKeyDown={evento => {
                                        if (evento.key === 'Enter' || evento.key === ' ') onAlternar(columna.nombre);
                                    }}
                                    title={columna.nombre}
                                    className="flex items-center text-left text-[12px] font-garet text-graphite hover:text-purple cursor-pointer"
                                >
                                    <Checkbox checked={visible} />
                                    <span className="truncate">{columna.etiqueta}</span>
                                </div>
                            );
                        })}
                    </ScrollContainer>
                </div>
            </Panel>
        </span>
    );
};

export default SelectorColumnas;
