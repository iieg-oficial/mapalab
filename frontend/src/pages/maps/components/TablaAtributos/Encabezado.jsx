import { useState } from 'react';
import MenuColumna from './MenuColumna';

const Encabezado = ({ columnas, plantilla, campos, orden, filtros, municipiosDe, onAplicar, onLimpiar, onOrdenar }) => {
    const [abierta, setAbierta] = useState(null);

    return (
        <div
            className="sticky top-0 z-2 grid bg-[#F9FBFF] border-b border-[#EAEFFA]"
            style={{ gridTemplateColumns: plantilla }}
        >
            <span aria-hidden="true" />
            {columnas.map(columna => {
                const conFiltro = Boolean(filtros[columna.nombre]);
                const esOrdenada = orden?.columna === columna.nombre;
                return (
                    <div key={columna.nombre} className="relative min-w-0">
                        <button
                            type="button"
                            onClick={() => setAbierta(actual => (actual === columna.nombre ? null : columna.nombre))}
                            aria-expanded={abierta === columna.nombre}
                            title={columna.nombre}
                            className={`w-full h-8 px-2 flex items-center gap-1 text-left text-[11px]/[14px] font-garet font-bold cursor-pointer hover:text-purple ${conFiltro || esOrdenada ? 'text-purple' : 'text-[#2E4372]'}`}
                        >
                            <span className="truncate">{columna.etiqueta}</span>
                            {esOrdenada && <span aria-hidden="true">{orden.descendente ? '↓' : '↑'}</span>}
                            {conFiltro && <span className="size-1.5 rounded-full bg-orange shrink-0" aria-hidden="true" />}
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
