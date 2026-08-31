import { useMemo, useState } from 'react';
import MobileSheet from '@components/MobileSheet';
import { useMapsContext } from '@hooks/useMaps';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';
import { useTablaDatos } from '@hooksMaps/useTablaDatos';
import { useTablaSeleccion } from '@hooksMaps/useTablaSeleccion';
import { posicionCentrada, useArrastreVentana } from '@hooksMaps/useArrastreVentana';
import { useCatalogoCampos } from '@hooksMaps/useStatsBuilder';
import ChipsFiltro from './ChipsFiltro';
import Encabezado from './Encabezado';
import Cuerpo from './Cuerpo';
import ExpresionCql from './ExpresionCql';
import FilaTarjeta from './FilaTarjeta';
import PestanasTablas from './PestanasTablas';
import VentanaBarra from './VentanaBarra';

const Ventana = ({ layerId, indice, activa, minimizada, esMovil }) => {
    const { activar, cerrar, nombreDe, capaDe } = useTablaAtributos();
    const { municipioMode } = useMapsContext();
    const datos = useTablaDatos(layerId, { minimizada });
    const catalogo = useCatalogoCampos(layerId, !minimizada);
    const seleccion = useTablaSeleccion(layerId, datos.layerDef);
    const { posicion, manejadores } = useArrastreVentana(() => posicionCentrada(indice));
    const [verCql, setVerCql] = useState(false);
    const [pestana, setPestana] = useState('datos');

    const nombre = nombreDe(layerId);
    const oculta = capaDe(layerId)?.visible === false;

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
            oculta={oculta}
            esGrupo={datos.esGrupo}
            hojasDelGrupo={datos.hojasDelGrupo}
            datos={datos}
            verCql={verCql}
            onAlternarCql={() => setVerCql(valor => !valor)}
            onCerrar={() => cerrar(layerId)}
            arrastre={esMovil ? null : manejadores}
        />
    );

    const filtrosActivos = datos.filtros.chips.length > 0 && (
        <div className="px-3 py-1.5 flex items-center gap-2 border-b border-[#EAEFFA] overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400">
            <ChipsFiltro
                chips={datos.filtros.chips}
                onQuitar={datos.filtros.quitar}
                onLimpiar={datos.filtros.limpiar}
                compacto
            />
        </div>
    );

    const plantilla = `repeat(${Math.max(datos.visibles.length, 1)}, minmax(150px, 1fr))`;

    const tabla = datos.disponible ? (
        <div className="flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-gray-400">
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
                <div className="min-w-full w-max">
                    <Encabezado
                        columnas={datos.visibles}
                        plantilla={plantilla}
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
                        plantilla={plantilla}
                        filas={datos.filas}
                        seleccionada={seleccion.seleccionada}
                        onSeleccionar={seleccion.seleccionar}
                    />
                </div>
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
            <span className="tabular-nums shrink-0">
                {datos.cargando ? 'Consultando…' : `${(datos.total ?? 0).toLocaleString('es-MX')} registros`}
            </span>
            {datos.error && (
                <span className="min-w-0 truncate text-[#C0392B]" title={datos.error}>
                    {datos.error}
                </span>
            )}
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
            {!esMovil && (
                <div className="px-2.5 pb-1.5">
                    <PestanasTablas tamano="compacta" />
                </div>
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
                        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-400">
                            <Encabezado
                                columnas={datos.visibles}
                                plantilla={plantilla}
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
            className={`fixed w-[min(760px,92vw)] h-[min(420px,60vh)] flex flex-col rounded-[10px] bg-white shadow-[0_5px_20px_#1A26641A] border overflow-hidden transition-colors ${activa ? 'border-purple' : 'border-[#EAEFFA]'}`}
        >
            {cuerpoCompleto}
        </div>
    );
};

export default Ventana;
