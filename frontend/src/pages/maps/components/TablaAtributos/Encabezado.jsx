import { useState } from 'react';
import MenuColumna from './MenuColumna';

const Encabezado = ({ columnas, campos, orden, filtros, municipiosDe, onAplicar, onLimpiar, onOrdenar }) => {
    const [abierta, setAbierta] = useState(null);

    return (
        <div className="flex sticky top-0 z-2 bg-[#F5F7FC] border-b border-[#DCE3F0]">
            {columnas.map(columna => {
                const conFiltro = Boolean(filtros[columna.nombre]);
                const esOrdenada = orden?.columna === columna.nombre;
                return (
                    <div key={columna.nombre} className="relative min-w-40 flex-1 border-r border-[#EAEFFA] last:border-r-0">
                        <button
                            type="button"
                            onClick={() => setAbierta(actual => (actual === columna.nombre ? null : columna.nombre))}
                            aria-expanded={abierta === columna.nombre}
                            className={`w-full h-9 px-2.5 flex items-center gap-1 text-left text-[12px] font-garet font-bold cursor-pointer hover:text-purple ${conFiltro || esOrdenada ? 'text-purple' : 'text-graphite'}`}
                        >
                            <span className="truncate">{columna.etiqueta}</span>
                            {esOrdenada && <span aria-hidden="true">{orden.descendente ? '↓' : '↑'}</span>}
                            {conFiltro && <span className="size-1.5 rounded-full bg-orange shrink-0" aria-hidden="true" />}
                            <span className="ml-auto text-[9px] opacity-60" aria-hidden="true">▾</span>
                        </button>

                        {abierta === columna.nombre && (
                            <div className="absolute left-0 top-full z-10 mt-1">
                                <MenuColumna
                                    columna={columna.nombre}
                                    campos={campos}
                                    municipios={municipiosDe(columna.nombre)}
                                    descriptor={filtros[columna.nombre]}
                                    orden={orden}
                                    onAplicar={descriptor => onAplicar(columna.nombre, descriptor)}
                                    onLimpiar={() => { onLimpiar(columna.nombre); setAbierta(null); }}
                                    onOrdenar={() => onOrdenar(columna.nombre)}
                                    onCerrar={() => setAbierta(null)}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default Encabezado;
