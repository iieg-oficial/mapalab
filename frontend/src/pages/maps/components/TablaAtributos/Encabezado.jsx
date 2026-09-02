import { useRef, useState } from 'react';
import Icon from '@components/Icon';
import Checkbox from '@components/Checkbox';
import Tooltip from '@components/Tooltip';
import Panel from '@components/Panel';
import MenuColumna from './MenuColumna';

const ColumnaEncabezado = ({
    columna, fija, abierta, onAlternar, onCerrar, campos, municipios, descriptor, orden, onAplicar, onLimpiar, onOrdenar,
}) => {
    const anclaRef = useRef(null);
    const conFiltro = Boolean(descriptor);
    const esOrdenada = orden?.columna === columna.nombre;

    return (
        <div className={`relative min-w-0 bg-[#F9FBFF] ${fija ? 'sticky left-8 z-3' : ''}`}>
            <button
                ref={anclaRef}
                type="button"
                onClick={onAlternar}
                aria-expanded={abierta}
                title={columna.nombre}
                className={`w-full h-8 px-2 flex items-center gap-1 text-left text-[11px]/[14px] font-garet font-bold cursor-pointer hover:text-purple ${conFiltro || esOrdenada ? 'text-purple' : 'text-[#2E4372]'}`}
            >
                <span className="truncate">{columna.etiqueta}</span>
                {esOrdenada && <span aria-hidden="true">{orden.descendente ? '↓' : '↑'}</span>}
                <Icon
                    name="filtro"
                    className={`size-3 ml-auto shrink-0 ${conFiltro ? 'text-orange' : 'text-[#B7C0D4]'}`}
                />
            </button>

            <Panel
                open={abierta}
                anchorRef={anclaRef}
                onClose={onCerrar}
                placement="bottom-start"
                width="w-64"
                noPadding
                hideHeader
                className="z-50"
            >
                <MenuColumna
                    columna={columna.nombre}
                    campos={campos}
                    municipios={municipios}
                    descriptor={descriptor}
                    orden={orden}
                    onAplicar={onAplicar}
                    onLimpiar={onLimpiar}
                    onOrdenar={onOrdenar}
                    onCerrar={onCerrar}
                />
            </Panel>
        </div>
    );
};

const Encabezado = ({ columnas, plantilla, campos, orden, filtros, municipiosDe, seleccion, onAplicar, onLimpiar, onOrdenar }) => {
    const [abierta, setAbierta] = useState(null);

    return (
        <div
            className="sticky top-0 z-2 grid bg-[#F9FBFF] border-b border-[#EAEFFA]"
            style={{ gridTemplateColumns: plantilla }}
        >
            <span className="sticky left-0 z-3 flex items-center justify-center bg-[#F9FBFF]">
                <Tooltip
                    content={seleccion.cuantas > 0
                        ? `Quitar la selección de ${seleccion.cuantas === 1 ? 'el registro' : `los ${seleccion.cuantas} registros`}`
                        : 'Seleccionar todos los registros cargados'}
                    placement="top"
                    delay={300}
                >
                    <Checkbox
                        checked={seleccion.cuantas > 0}
                        onChange={seleccion.cuantas > 0 ? seleccion.limpiar : seleccion.todas}
                        className="mr-0"
                    />
                </Tooltip>
            </span>
            {columnas.map((columna, posicion) => (
                <ColumnaEncabezado
                    key={columna.nombre}
                    columna={columna}
                    fija={posicion === 0}
                    abierta={abierta === columna.nombre}
                    onAlternar={() => setAbierta(actual => (actual === columna.nombre ? null : columna.nombre))}
                    onCerrar={() => setAbierta(null)}
                    campos={campos}
                    municipios={municipiosDe(columna.nombre)}
                    descriptor={filtros[columna.nombre]}
                    orden={orden}
                    onAplicar={descriptor => onAplicar(columna.nombre, descriptor)}
                    onLimpiar={() => { onLimpiar(columna.nombre); setAbierta(null); }}
                    onOrdenar={() => onOrdenar(columna.nombre)}
                />
            ))}
        </div>
    );
};

export default Encabezado;
