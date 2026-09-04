import { useEffect, useMemo, useRef, useState } from 'react';
import MobileSheet from '@components/MobileSheet';
import Loading from '@components/Loading';
import { useMapsContext } from '@hooks/useMaps';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';
import { useTablaDatos } from '@hooksMaps/useTablaDatos';
import { useTablaSeleccion } from '@hooksMaps/useTablaSeleccion';
import { posicionCentrada, useArrastreVentana } from '@hooksMaps/useArrastreVentana';
import { estiloDelPanel } from '@pages/maps/helpers/tablaAcople';
import { useAltoAcoplado } from '@hooksMaps/useAltoAcoplado';
import VistaPreviaSnap from './VistaPreviaSnap';
import { useCatalogoCampos } from '@hooksMaps/useStatsBuilder';
import ChipsFiltro from './ChipsFiltro';
import Encabezado from './Encabezado';
import Cuerpo from './Cuerpo';
import ExpresionCql from './ExpresionCql';
import FilaTarjeta from './FilaTarjeta';
import PestanasTablas from './PestanasTablas';
import VentanaBarra from './VentanaBarra';

const Ventana = ({ layerId, indice, activa, minimizada, esMovil }) => {
    const {
        activar, cerrarTodas, nombreDe, capaDe, acople, acoplar, altoAcople, fijarAltoAcople,
    } = useTablaAtributos();
    const { municipioMode } = useMapsContext();
    const datos = useTablaDatos(layerId, { minimizada });
    const catalogo = useCatalogoCampos(layerId, !minimizada);
    const seleccion = useTablaSeleccion(layerId, datos.layerDef, datos.filas, datos.tarjeta);
    const { posicion, manejadores, zona } = useArrastreVentana(() => posicionCentrada(indice), acoplar);
    const tirador = useAltoAcoplado(altoAcople, fijarAltoAcople);
    const [verCql, setVerCql] = useState(false);
    const scrollRef = useRef(null);
    const desplazamientoRef = useRef(0);
    const [pestana, setPestana] = useState('datos');

    useEffect(() => {
        const contenedor = scrollRef.current;
        if (contenedor && desplazamientoRef.current) {
            contenedor.scrollLeft = desplazamientoRef.current;
        }
    }, [datos.filas, datos.visibles]);

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
            layerId={layerId}
            esGrupo={datos.esGrupo}
            hojasDelGrupo={datos.hojasDelGrupo}
            datos={datos}
            verCql={verCql}
            onAlternarCql={() => setVerCql(valor => !valor)}
            onCerrar={cerrarTodas}
            acople={acople}
            onAcoplar={acoplar}
            arrastre={esMovil ? null : manejadores}
        />
    );

    const chips = [...datos.chipsHeredados, ...datos.filtros.chips];

    const filtrosActivos = chips.length > 0 && (
        <div className="px-3 py-1.5 flex items-center gap-2 border-b border-[#EAEFFA] overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400">
            <ChipsFiltro
                chips={chips}
                onQuitar={datos.filtros.quitar}
                onLimpiar={datos.filtros.limpiar}
                compacto
            />
        </div>
    );

    const plantilla = `32px repeat(${Math.max(datos.visibles.length, 1)}, minmax(150px, 1fr))`;

    const alScroll = (evento) => {
        const { scrollTop, scrollHeight, clientHeight, scrollLeft } = evento.currentTarget;
        desplazamientoRef.current = scrollLeft;
        if (scrollHeight - scrollTop - clientHeight < 160) datos.cargarMas();
    };

    const tabla = datos.disponible ? (
        <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-gray-400"
            onScroll={alScroll}
        >
            {esMovil ? (
                datos.filas.map((feature, posicionFila) => (
                    <FilaTarjeta
                        key={feature?.id || posicionFila}
                        columnas={datos.visibles}
                        feature={feature}
                        activa={seleccion.seleccionadas.has(feature?.id)}
                        onSeleccionar={fila => seleccion.seleccionar(fila, posicionFila, {})}
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
                        seleccion={seleccion}
                        onAplicar={datos.filtros.poner}
                        onLimpiar={datos.filtros.quitar}
                        onOrdenar={datos.alternarOrden}
                    />
                    <Cuerpo
                        columnas={datos.visibles}
                        plantilla={plantilla}
                        filas={datos.filas}
                        seleccionadas={seleccion.seleccionadas}
                        onSeleccionar={seleccion.seleccionar}
                    />
                </div>
            )}
            {datos.cargando && datos.filas.length === 0 && (
                <div className="p-8 flex flex-col items-center gap-2">
                    <Loading visible size="size-8" border="border-2" color="border-purple" />
                    <span className="text-[11px] font-garet text-[#8A94A6]">Consultando los registros…</span>
                </div>
            )}
            {!datos.cargando && datos.filas.length === 0 && !datos.error && (
                <p className="p-4 text-[12px] font-garet text-[#8A94A6]">
                    Ningún registro cumple con los filtros.
                </p>
            )}
            {datos.cargandoMas && (
                <div className="p-2 flex items-center justify-center gap-2 text-[11px] font-garet text-[#8A94A6]">
                    <Loading visible size="size-3.5" border="border-1" color="border-purple" />
                    Trayendo más registros…
                </div>
            )}
        </div>
    ) : (
        <p className="p-4 text-[12px] font-garet text-graphite">{datos.mensaje}</p>
    );

    const pie = datos.disponible && (
        <div className="px-3 h-8 flex items-center gap-3 border-t border-[#EAEFFA] text-[11px] font-garet text-[#6B7585]">
            <span className="tabular-nums shrink-0 flex items-center gap-1.5">
                <Loading visible={datos.cargando} size="size-3" border="border-1" color="border-purple" />
                {datos.cargando
                    ? 'Consultando…'
                    : `${datos.filas.length.toLocaleString('es-MX')} de ${(datos.total ?? 0).toLocaleString('es-MX')} registros`}
            </span>
            {seleccion.cuantas > 0 && (
                <button
                    type="button"
                    onClick={seleccion.limpiar}
                    className="shrink-0 text-purple hover:underline cursor-pointer"
                >
                    {seleccion.cuantas === 1 ? '1 seleccionado' : `${seleccion.cuantas} seleccionados`}
                    {seleccion.soloSeleccionados ? ' · solo estos en el mapa · limpiar' : ' · limpiar'}
                </button>
            )}
            {datos.error && (
                <span className="min-w-0 truncate text-[#C0392B]" title={datos.error}>
                    {datos.error}
                </span>
            )}
        </div>
    );

    const cuerpoCompleto = (
        <>
            {cabecera}
            {!esMovil && (
                <div className="px-3 pb-1.5">
                    <PestanasTablas />
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
            <MobileSheet open onClose={cerrarTodas} maxHeightClass="max-h-[92vh]">
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
                                seleccion={seleccion}
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

    const acoplado = acople !== 'flotante';
    const estiloAcoplado = acoplado
        ? estiloDelPanel(acople, { ancho: window.innerWidth, alto: window.innerHeight }, altoAcople)
        : null;

    return (
        <>
            <VistaPreviaSnap zona={zona} />
            <div
                role="dialog"
                aria-label={`Tabla de atributos de ${nombre}`}
                onPointerDown={() => activar(layerId)}
                style={estiloAcoplado
                    ? { ...estiloAcoplado, zIndex: activa ? 9 : 8 }
                    : { left: posicion.x, top: posicion.y, zIndex: activa ? 13 : 12 }}
                className={`
                    fixed flex flex-col bg-white shadow-[0_5px_20px_#1A26641A] overflow-hidden transition-colors
                    ${acoplado
            ? 'rounded-none border-0'
            : `w-[min(760px,92vw)] h-[min(420px,60vh)] rounded-[10px] border ${activa ? 'border-purple' : 'border-[#EAEFFA]'}`}
                `}
            >
                {acoplado && (
                    <div
                        {...tirador}
                        role="separator"
                        aria-label="Ajustar el alto del panel"
                        className="h-1.5 shrink-0 cursor-ns-resize touch-none bg-[#F2F5FB] hover:bg-[#DCE3F0] transition-colors"
                    />
                )}
                {cuerpoCompleto}
            </div>
        </>
    );
};

export default Ventana;
