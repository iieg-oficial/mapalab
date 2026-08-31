import { useMemo, useState } from 'react';
import MobileSheet from '@components/MobileSheet';
import { useMapsContext } from '@hooks/useMaps';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';
import { useTablaDatos } from '@hooksMaps/useTablaDatos';
import { useTablaSeleccion } from '@hooksMaps/useTablaSeleccion';
import { useArrastreVentana } from '@hooksMaps/useArrastreVentana';
import { useCatalogoCampos } from '@hooksMaps/useStatsBuilder';
import ChipsFiltro from './ChipsFiltro';
import Encabezado from './Encabezado';
import Cuerpo from './Cuerpo';
import ExpresionCql from './ExpresionCql';
import FilaTarjeta from './FilaTarjeta';
import VentanaBarra from './VentanaBarra';

const Ventana = ({ layerId, indice, activa, minimizada, esMovil }) => {
    const { activar, cerrar } = useTablaAtributos();
    const { municipioMode } = useMapsContext();
    const datos = useTablaDatos(layerId, { minimizada });
    const catalogo = useCatalogoCampos(layerId, !minimizada);
    const seleccion = useTablaSeleccion(layerId, datos.layerDef);
    const { posicion, manejadores } = useArrastreVentana({ x: 72 + indice * 26, y: 96 + indice * 26 });
    const [verCql, setVerCql] = useState(false);
    const [pestana, setPestana] = useState('datos');

    const nombre = datos.layerDef?.label || datos.layerDef?.name || 'Capa';

    const municipiosDe = useMemo(() => (columna) => {
        const meta = datos.layerDef?.searchMeta;
        if (!meta?.hasMunicipio || meta.municipioField !== columna) return null;
        const lista = municipioMode?.allMunicipios || [];
        if (lista.length === 0) return null;
        return meta.municipioFieldType === 'nombre'
            ? lista.map(item => item.nombre)
            : lista.map(item => String(item.clave));
    }, [datos.layerDef, municipioMode?.allMunicipios]);

    if (minimizada) return null;

    const cabecera = (
        <VentanaBarra
            nombre={nombre}
            datos={datos}
            verCql={verCql}
            onAlternarCql={() => setVerCql(valor => !valor)}
            onCerrar={() => cerrar(layerId)}
            arrastre={esMovil ? null : manejadores}
        />
    );

    const filtrosActivos = (
        <div className="px-3 py-1.5 flex items-center gap-2 border-b border-[#EAEFFA] min-h-9 overflow-x-auto scrollbar-thin">
            <ChipsFiltro
                chips={datos.filtros.chips}
                onQuitar={datos.filtros.quitar}
                onLimpiar={datos.filtros.limpiar}
                compacto
            />
            {datos.filtros.chips.length === 0 && (
                <span className="text-[11px] font-garet text-[#8A94A6]">Sin filtros: se muestra la capa completa</span>
            )}
        </div>
    );

    const tabla = datos.disponible ? (
        <div className="flex-1 min-h-0 overflow-auto scrollbar-thin">
            {esMovil ? (
                datos.filas.map((feature, posicionFila) => (
                    <FilaTarjeta
                        key={feature?.id || posicionFila}
                        columnas={datos.visibles}
                        feature={feature}
                        activa={seleccion.seleccionada === feature?.id}
                        onSeleccionar={seleccion.seleccionar}
                    />
                ))
            ) : (
                <>
                    <Encabezado
                        columnas={datos.visibles}
                        campos={catalogo?.campos}
                        orden={datos.orden}
                        filtros={datos.filtros.filtros}
                        municipiosDe={municipiosDe}
                        onAplicar={datos.filtros.poner}
                        onLimpiar={datos.filtros.quitar}
                        onOrdenar={datos.alternarOrden}
                    />
                    <Cuerpo
                        columnas={datos.visibles}
                        filas={datos.filas}
                        seleccionada={seleccion.seleccionada}
                        onSeleccionar={seleccion.seleccionar}
                    />
                </>
            )}
            {!datos.cargando && datos.filas.length === 0 && !datos.error && (
                <p className="p-4 text-[12px] font-garet text-[#8A94A6]">
                    Ningún registro cumple con los filtros.
                </p>
            )}
        </div>
    ) : (
        <p className="p-4 text-[12px] font-garet text-graphite">{datos.mensaje}</p>
    );

    const pie = datos.disponible && (
        <div className="px-3 h-8 flex items-center gap-3 border-t border-[#EAEFFA] text-[11px] font-garet text-[#6B7585]">
            <span className="tabular-nums">
                {datos.cargando ? 'Consultando…' : `${(datos.total ?? 0).toLocaleString('es-MX')} registros`}
            </span>
            <span className="ml-auto flex items-center gap-2">
                <button
                    type="button"
                    disabled={datos.pagina === 0}
                    onClick={() => datos.irAPagina(datos.pagina - 1)}
                    className="px-1.5 rounded hover:text-purple disabled:opacity-40 disabled:cursor-default cursor-pointer"
                >
                    ◀
                </button>
                <span className="tabular-nums">{datos.pagina + 1} de {datos.totalPaginas}</span>
                <button
                    type="button"
                    disabled={datos.pagina + 1 >= datos.totalPaginas}
                    onClick={() => datos.irAPagina(datos.pagina + 1)}
                    className="px-1.5 rounded hover:text-purple disabled:opacity-40 disabled:cursor-default cursor-pointer"
                >
                    ▶
                </button>
            </span>
        </div>
    );

    const cuerpoCompleto = (
        <>
            {cabecera}
            {datos.error && (
                <p className="px-3 py-2 text-[11px] font-garet text-[#C0392B] border-b border-[#EAEFFA]">
                    {datos.error}
                </p>
            )}
            {verCql && datos.disponible && (
                <ExpresionCql
                    cql={datos.filtros.cqlDeFiltros}
                    expresionPropia={datos.filtros.expresionPropia}
                    error={datos.error}
                    onFijar={datos.filtros.fijarExpresion}
                    onCerrar={() => setVerCql(false)}
                />
            )}
            {datos.disponible && filtrosActivos}
            {tabla}
            {pie}
        </>
    );

    if (esMovil) {
        return (
            <MobileSheet open onClose={() => cerrar(layerId)} maxHeightClass="max-h-[92vh]">
                <div className="flex flex-col h-[85vh]">
                    <div className="flex border-b border-[#EAEFFA]">
                        {[['datos', 'Datos'], ['filtros', 'Filtros']].map(([clave, texto]) => (
                            <button
                                key={clave}
                                type="button"
                                onClick={() => setPestana(clave)}
                                className={`flex-1 h-9 text-[12px] font-garet cursor-pointer ${pestana === clave ? 'text-purple font-bold border-b-2 border-purple' : 'text-graphite'}`}
                            >
                                {texto}
                            </button>
                        ))}
                    </div>
                    {pestana === 'datos' ? cuerpoCompleto : (
                        <div className="flex-1 overflow-auto scrollbar-thin">
                            <Encabezado
                                columnas={datos.visibles}
                                campos={catalogo?.campos}
                                orden={datos.orden}
                                filtros={datos.filtros.filtros}
                                municipiosDe={municipiosDe}
                                onAplicar={datos.filtros.poner}
                                onLimpiar={datos.filtros.quitar}
                                onOrdenar={datos.alternarOrden}
                            />
                        </div>
                    )}
                </div>
            </MobileSheet>
        );
    }

    return (
        <div
            role="dialog"
            aria-label={`Tabla de atributos de ${nombre}`}
            onPointerDown={() => activar(layerId)}
            style={{ left: posicion.x, top: posicion.y, zIndex: activa ? 13 : 12 }}
            className="fixed w-[min(760px,92vw)] h-[min(420px,60vh)] flex flex-col rounded-[10px] bg-white shadow-[0_5px_20px_#1A26641A] border border-[#EAEFFA] overflow-hidden"
        >
            {cuerpoCompleto}
        </div>
    );
};

export default Ventana;
