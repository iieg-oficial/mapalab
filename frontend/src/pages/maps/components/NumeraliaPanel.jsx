import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@components/Icon';
import PanelHeader from '@components/PanelHeader';
import { useMapsContext } from '@hooks/useMaps';
import { useSider } from '@contexts/SiderContext';
import { useClearance } from '@hooks/useClearance';
import { useAreaUtil } from '@contexts/AreaUtilContext';
import { SIDER_TRANSITION_CLASSES } from '@constants/sider';
import { PANEL_GAP, VIEWPORT_EDGE } from '@pages/maps/helpers/mapFit';
import { useNumeraliaPanel } from '@contexts/NumeraliaPanelContext';
import { useLayerMetadata, useMetadataContext } from '@hooksMaps/useLayerMetadata';
import { useNumeraliaComparador, construirFilas } from '@hooksMaps/useNumeraliaComparador';
import { useNumeraliaRanking, ordenarRanking } from '@hooksMaps/useNumeraliaRanking';
import { useComparadorGrafica } from '@hooksMaps/useComparadorGrafica';
import { useNumeraliaLados } from '@hooksMaps/useNumeraliaLados';
import {
    MAX_PROPIAS, definicionVacia, useCatalogoCampos,
    usePersonalizadasCalculadas, useVistaPrevia,
} from '@hooksMaps/useStatsBuilder';
import ComparadorTabla from './NumeraliaPanel/ComparadorTabla';
import ComparadorGrafica from './NumeraliaPanel/ComparadorGrafica';
import ControlesGrafica from './NumeraliaPanel/ControlesGrafica';
import AccionesPanel from './NumeraliaPanel/AccionesPanel';
import RankingTabla from './NumeraliaPanel/RankingTabla';
import Constructor from './NumeraliaPanel/Constructor';
import TarjetasResumen from './NumeraliaPanel/TarjetasResumen';
import ResumenSwipe from './NumeraliaPanel/ResumenSwipe';
import SwipeEstadisticas from './NumeraliaPanel/SwipeEstadisticas';
import DetalleAmbito from './NumeraliaPanel/DetalleAmbito';
import PillMinimizada from './NumeraliaPanel/PillMinimizada';

const OBSTACULOS = ['.ol-scale-line', '.ol-attribution', '[data-barra-tabla]', '#dock-pills', '[data-pila-inferior]'];

const MODOS = [
    { clave: 'comparar', icono: 'comparar', titulo: 'Comparar municipios', etiqueta: 'Comparar estadísticas entre municipios' },
    { clave: 'ranking', icono: 'ranking', titulo: 'Ranking estatal', etiqueta: 'Ver el ranking de los municipios' },
    { clave: 'crear', icono: 'crear', titulo: 'Crear estadística', etiqueta: 'Armar una estadística propia' },
];

const TITULOS = { comparar: 'Comparar municipios', ranking: 'Ranking estatal', crear: 'Nueva estadística' };
const TITULOS_CORTOS = { comparar: 'Comparador', ranking: 'Ranking', crear: 'Nueva' };

const slotsDe = (metadata) => (metadata?.numeralia || []).filter(s => s.nombre && s.valor);
const dinamicaDe = (metadata) => slotsDe(metadata).some(s => s.receta?.tipo === 'primitiva');

const NumeraliaPanel = () => {
    const {
        abierto, minimizado, detachedLayerId, attach, seguir, alternarMinimizado, highlight,
        modo, abrirModo, cerrarModo, clavesComparadas, compararCon, quitarComparado, reordenarComparados,
        rankingPorcentaje, fijarRankingPorcentaje, rankingIndiceDe, fijarRankingIndice,
        borradorDe, fijarBorrador,
        personalizadasDe, agregarPersonalizada, quitarPersonalizada,
        vistaGrafica, fijarVistaGrafica,
        graficaEje, graficaMunicipio, graficaIndicadorDe,
        fijarGraficaEje, fijarGraficaMunicipio, fijarGraficaIndicador,
    } = useNumeraliaPanel();
    const { municipioMode, selectedLayer, selectedLayerForSymbology } = useMapsContext();
    const { width: siderWidth, isMobile } = useSider();
    const { margenes } = useAreaUtil();
    const enFoco = selectedLayerForSymbology?.id || selectedLayer?.id || null;
    const layerId = abierto ? (enFoco || detachedLayerId) : null;
    const { lado, ambos, contexto, contextos, metadataOtro } = useNumeraliaLados(layerId, useMetadataContext(municipioMode));
    const { metadata } = useLayerMetadata(layerId, contexto);
    const [resaltado, setResaltado] = useState(false);
    const [eligiendo, setEligiendo] = useState(false);
    const panelRef = useRef(null);

    const indiceGuardado = rankingIndiceDe(layerId);
    const borrador = borradorDe(layerId);

    const comparando = modo === 'comparar';
    const enRanking = modo === 'ranking';
    const creando = modo === 'crear';

    const inferior = useClearance(panelRef, { lado: 'bottom', obstaculos: OBSTACULOS, base: isMobile ? 60 : 64, separacion: 8, activo: abierto && !minimizado });
    const { columnas, cargando } = useNumeraliaComparador(comparando ? layerId : null, clavesComparadas, contexto);
    const { ranking, cargando: cargandoRanking } = useNumeraliaRanking(layerId, enRanking, contexto);
    const catalogo = useCatalogoCampos(layerId, creando);
    const { previa, calculando } = useVistaPrevia(creando ? layerId : null, borrador, contexto);
    const propias = personalizadasDe(layerId);
    const valoresPropios = usePersonalizadasCalculadas(layerId, propias, contexto);

    useEffect(() => {
        if (abierto && enFoco) seguir(enFoco);
    }, [abierto, enFoco, seguir]);

    useEffect(() => {
        if (!highlight) return undefined;
        setResaltado(true);
        const id = setTimeout(() => setResaltado(false), 1200);
        return () => clearTimeout(id);
    }, [highlight]);

    useEffect(() => {
        if (metadata && !dinamicaDe(metadata) && modo !== 'resumen') cerrarModo();
    }, [metadata, modo, cerrarModo]);

    useEffect(() => {
        if (!comparando) { setEligiendo(false); return; }
        if (clavesComparadas.length === 0) {
            const iniciales = municipioMode?.municipioContext?.claves || [];
            if (iniciales.length) compararCon(iniciales);
            else setEligiendo(true);
        }
        if (!municipioMode?.allMunicipios?.length) municipioMode?.loadList?.();
    }, [comparando, clavesComparadas.length, municipioMode, compararCon]);

    const { porClave, porNombre } = useMemo(() => {
        const lista = municipioMode?.allMunicipios || [];
        return {
            porClave: new Map(lista.map(m => [String(m.clave), m.nombre])),
            porNombre: new Map(lista.map(m => [m.nombre, String(m.clave)])),
        };
    }, [municipioMode?.allMunicipios]);

    const columnasConNombre = useMemo(
        () => columnas.map(col => ({ ...col, nombre: porClave.get(col.clave) || col.clave })),
        [columnas, porClave],
    );

    const filas = useMemo(
        () => (columnasConNombre.length ? construirFilas(columnasConNombre) : []),
        [columnasConNombre],
    );

    const indiceRanking = Math.min(indiceGuardado, Math.max((ranking?.slots?.length || 1) - 1, 0));

    const filasRanking = useMemo(
        () => ordenarRanking(ranking, indiceRanking, rankingPorcentaje),
        [ranking, indiceRanking, rankingPorcentaje],
    );

    const resaltadas = useMemo(() => {
        const ctx = municipioMode?.municipioContext;
        if (!ctx?.active) return new Set();
        return new Set(ranking?.tipo === 'clave' ? ctx.claves : ctx.nombres);
    }, [municipioMode?.municipioContext, ranking?.tipo]);

    const picker = useMemo(() => ({
        abierto: eligiendo,
        municipios: municipioMode?.allMunicipios || [],
        excluidas: clavesComparadas,
        cargando: Boolean(municipioMode?.listLoading),
        onAlternar: () => setEligiendo(v => !v),
        onCerrar: () => setEligiendo(false),
        onElegir: (clave) => {
            compararCon([clave]);
            setEligiendo(false);
        },
    }), [eligiendo, municipioMode?.allMunicipios, municipioMode?.listLoading, clavesComparadas, compararCon]);

    const { grupos: gruposGrafica, municipios: municipioGrafica, indicadores: indicadorGrafica } =
        useComparadorGrafica({ filas, clavesComparadas, layerId, graficaMunicipio, graficaIndicadorDe });

    const controlesGrafica = (
        <ControlesGrafica
            grupos={gruposGrafica}
            columnas={columnasConNombre}
            eje={graficaEje}
            onEje={fijarGraficaEje}
            municipio={municipioGrafica}
            onMunicipio={fijarGraficaMunicipio}
            indicador={indicadorGrafica}
            onIndicador={(v) => fijarGraficaIndicador(layerId, v)}
        />
    );

    const guardar = () => {
        agregarPersonalizada(layerId, borrador);
        fijarBorrador(layerId, definicionVacia());
        cerrarModo();
    };

    const slots = slotsDe(metadata);
    if (!abierto || slots.length === 0) return null;

    const dinamica = dinamicaDe(metadata);
    const ambito = metadata?.ambito;
    const nombreCapa = metadata.nombre_capa_usuario || 'Estadísticas';
    const anillo = resaltado ? 'ring-2 ring-orange' : '';

    const detalle = <DetalleAmbito lado={lado} ambos={ambos} modo={modo} ambito={ambito} creando={creando} />;

    const propsAcciones = { modos: MODOS, modo, dinamica, onModo: abrirModo, onMinimizar: alternarMinimizado, onCerrar: attach };

    return (
        <div
            className={`flex fixed z-11 justify-center pointer-events-none ${SIDER_TRANSITION_CLASSES}`}
            style={{
                bottom: inferior + margenes.bottom,
                left: isMobile ? VIEWPORT_EDGE : siderWidth + VIEWPORT_EDGE + PANEL_GAP,
                right: VIEWPORT_EDGE + (isMobile ? 0 : PANEL_GAP),
            }}
        >
            {ambos && <SwipeEstadisticas layerId={layerId} metadata={metadata} contextos={contextos} />}
            {minimizado ? (
                <PillMinimizada
                    pillRef={panelRef}
                    nombreCapa={nombreCapa}
                    onAbrir={alternarMinimizado}
                    onCerrar={attach}
                    anillo={anillo}
                />
            ) : (
                <section
                    ref={panelRef}
                    data-panel-numeralia
                    className={`relative pointer-events-auto max-w-full max-h-[80vh] overflow-y-auto overflow-x-hidden scrollbar-thin px-4.5 pt-2 pb-4.5 rounded-[10px] bg-[#F9FBFF] shadow-[0_5px_20px_#1A26641A] transition-shadow font-garet ${anillo}`}
                    aria-label={`Estadísticas de ${nombreCapa}`}
                    aria-live="polite"
                >
                    <PanelHeader
                        className="" grande icono={<Icon name="numeralia" className="size-8 text-purple shrink-0" />}
                        onVolver={modo === 'resumen' ? null : cerrarModo}
                        titulo={modo === 'resumen'
                            ? nombreCapa
                            : (isMobile ? TITULOS_CORTOS[modo] : TITULOS[modo])}
                        acciones={<AccionesPanel {...propsAcciones} parte="ventana" />}
                    />
                    <div className="flex items-center justify-between gap-3 mb-4">{detalle}<div className="flex items-center gap-1 shrink-0"><AccionesPanel {...propsAcciones} parte="modos" /></div></div>

                    {ambos && isMobile && <div data-numeralia-ranura className="empty:hidden mb-3" />}
                    <div className="overflow-x-auto overflow-y-hidden scrollbar-thin">

                        {creando && (
                            <Constructor
                                catalogo={catalogo}
                                definicion={borrador}
                                onDefinicion={(d) => fijarBorrador(layerId, d)}
                                previa={previa}
                                calculando={calculando}
                                onGuardar={guardar}
                                lleno={propias.length >= MAX_PROPIAS}
                            />
                        )}

                        {enRanking && (
                            ranking ? (
                                <RankingTabla
                                    ranking={ranking}
                                    filas={filasRanking}
                                    indice={indiceRanking}
                                    onIndice={(v) => fijarRankingIndice(layerId, v)}
                                    porcentaje={rankingPorcentaje}
                                    onPorcentaje={fijarRankingPorcentaje}
                                    resaltadas={resaltadas}
                                    claves={ranking.tipo === 'clave' ? porClave : porNombre}
                                />
                            ) : (
                                <p className="text-[11px]/[14px] text-[#8894AE] py-2">
                                    {cargandoRanking ? 'Calculando…' : 'Esta capa no se puede agrupar por municipio.'}
                                </p>
                            )
                        )}

                        {comparando && (
                            <ComparadorTabla
                                columnas={columnasConNombre}
                                filas={filas}
                                onQuitar={quitarComparado}
                                onReordenar={reordenarComparados}
                                picker={picker}
                                vistaGrafica={vistaGrafica}
                                onVistaGrafica={fijarVistaGrafica}
                                controlesGrafica={controlesGrafica}
                                vacio={cargando ? 'Calculando…' : 'Elige un municipio para comparar.'}
                            >
                                <ComparadorGrafica
                                    columnas={columnasConNombre}
                                    filas={filas}
                                    eje={graficaEje}
                                    municipio={municipioGrafica}
                                    indicador={indicadorGrafica}
                                />
                            </ComparadorTabla>
                        )}

                        {modo === 'resumen' && ambos && (
                            <ResumenSwipe lado={lado} metadata={metadata} metadataOtro={metadataOtro} />
                        )}

                        {modo === 'resumen' && !ambos && (
                            <TarjetasResumen slots={slots} propias={valoresPropios} onQuitarPropia={(i) => quitarPersonalizada(layerId, i)} />
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};

export default NumeraliaPanel;
