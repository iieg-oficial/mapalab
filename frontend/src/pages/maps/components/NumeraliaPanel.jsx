import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useMapsContext } from '@hooks/useMaps';
import { useSider } from '@contexts/SiderContext';
import { SIDER_TRANSITION_CLASSES } from '@constants/sider';
import { PANEL_GAP, VIEWPORT_EDGE } from '@pages/maps/helpers/mapFit';
import { useNumeraliaPanel } from '@contexts/NumeraliaPanelContext';
import { useLayerMetadata, useMetadataContext } from '@hooksMaps/useLayerMetadata';
import { useNumeraliaComparador, construirFilas } from '@hooksMaps/useNumeraliaComparador';
import { useNumeraliaRanking, ordenarRanking } from '@hooksMaps/useNumeraliaRanking';
import {
    MAX_PROPIAS, definicionVacia, useCatalogoCampos, usePersonalizadas,
    usePersonalizadasCalculadas, useVistaPrevia,
} from '@hooksMaps/useStatsBuilder';
import ComparadorTabla from './NumeraliaPanel/ComparadorTabla';
import RankingTabla from './NumeraliaPanel/RankingTabla';
import AccionesEncabezado from './NumeraliaPanel/AccionesEncabezado';
import Constructor from './NumeraliaPanel/Constructor';
import TarjetasResumen from './NumeraliaPanel/TarjetasResumen';

const NumeraliaPanel = () => {
    const {
        abierto, minimizado, detachedLayerId, attach, seguir, alternarMinimizado, highlight,
        modo, abrirModo, cerrarModo, clavesComparadas, compararCon, quitarComparado,
    } = useNumeraliaPanel();
    const { municipioMode, selectedLayer, selectedLayerForSymbology } = useMapsContext();
    const { width: siderWidth, isMobile } = useSider();
    const enFoco = selectedLayerForSymbology?.id || selectedLayer?.id || null;
    const layerId = abierto ? (enFoco || detachedLayerId) : null;
    const contexto = useMetadataContext(municipioMode);
    const { metadata } = useLayerMetadata(layerId, contexto);
    const [resaltado, setResaltado] = useState(false);
    const [orden, setOrden] = useState('mas');
    const [eligiendo, setEligiendo] = useState(false);
    const [indiceRanking, setIndiceRanking] = useState(0);
    const [rankingPorcentaje, setRankingPorcentaje] = useState(false);
    const panelRef = useRef(null);

    const comparando = modo === 'comparar';
    const enRanking = modo === 'ranking';
    const { columnas, cargando } = useNumeraliaComparador(comparando ? layerId : null, clavesComparadas);
    const { ranking, cargando: cargandoRanking } = useNumeraliaRanking(layerId, enRanking);

    const creando = modo === 'crear';
    const [borrador, setBorrador] = useState(definicionVacia);
    const catalogo = useCatalogoCampos(layerId, creando);
    const { previa, calculando } = useVistaPrevia(creando ? layerId : null, borrador, contexto);
    const { propias, agregar, quitar } = usePersonalizadas(layerId);
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
        if (!comparando) { setEligiendo(false); return; }
        if (clavesComparadas.length === 0) {
            const iniciales = municipioMode?.municipioContext?.claves || [];
            if (iniciales.length) compararCon(iniciales);
            else setEligiendo(true);
        }
        if (!municipioMode?.allMunicipios?.length) municipioMode?.loadList?.();
    }, [comparando, clavesComparadas.length, municipioMode, compararCon]);

    const nombrePorClave = useMemo(() => {
        const lista = municipioMode?.allMunicipios || [];
        return new Map(lista.map(m => [String(m.clave), m.nombre]));
    }, [municipioMode?.allMunicipios]);

    const columnasConNombre = useMemo(
        () => columnas.map(col => ({ ...col, nombre: nombrePorClave.get(col.clave) || col.clave })),
        [columnas, nombrePorClave],
    );

    const filas = useMemo(
        () => (columnasConNombre.length ? construirFilas(columnasConNombre, orden) : []),
        [columnasConNombre, orden],
    );

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

    const guardar = () => {
        agregar(borrador);
        setBorrador(definicionVacia());
        cerrarModo();
    };

    const slots = (metadata?.numeralia || []).filter(s => s.nombre && s.valor);
    if (!abierto || slots.length === 0) return null;

    const dinamica = slots.some(s => s.receta?.tipo === 'primitiva');
    const ambito = metadata?.ambito;
    const nombreCapa = metadata.nombre_capa_usuario || 'Estadísticas';
    const anillo = resaltado ? 'ring-2 ring-[#70308A]' : '';

    return (
        <div
            className={`flex fixed bottom-15 md:bottom-16 z-11 justify-center pointer-events-none ${SIDER_TRANSITION_CLASSES}`}
            style={{
                left: isMobile ? VIEWPORT_EDGE : siderWidth + VIEWPORT_EDGE + PANEL_GAP,
                right: VIEWPORT_EDGE + (isMobile ? 0 : PANEL_GAP),
            }}
        >
            {minimizado ? (
                <button
                    type="button"
                    ref={panelRef}
                    onClick={alternarMinimizado}
                    aria-expanded="false"
                    aria-label={`Abrir las estadísticas de ${nombreCapa}`}
                    className={`pointer-events-auto max-w-full flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-[#F9FBFF] shadow-[0_5px_20px_#1A26641A] cursor-pointer transition-shadow ${anillo}`}
                >
                    <Icon name="numeralia" className="size-5 shrink-0 text-purple" />
                    <span className="font-garet font-bold text-[12px]/[15px] truncate">{nombreCapa}</span>
                    <Icon name="upArrow" className="size-2.5 shrink-0" />
                </button>
            ) : (
                <section
                    ref={panelRef}
                    className={`relative pointer-events-auto max-w-full max-h-[60vh] overflow-auto scrollbar-thin px-4 py-2.5 rounded-[10px] bg-[#F9FBFF] shadow-[0_5px_20px_#1A26641A] transition-shadow ${anillo}`}
                    aria-label={`Estadísticas de ${nombreCapa}`}
                    aria-live="polite"
                >
                    <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <Icon name="numeralia" className="size-8 shrink-0 text-purple" />
                            {creando ? (
                                <button
                                    type="button"
                                    onClick={cerrarModo}
                                    className="font-garet font-bold text-[11px]/[14px] text-purple shrink-0 cursor-pointer hover:underline"
                                >
                                    ← Estadísticas
                                </button>
                            ) : (
                                <h3 className="font-garet font-bold text-[13px]/[16px] truncate">{nombreCapa}</h3>
                            )}
                            {modo === 'resumen' && (
                                <p className="text-[11px]/[13px] font-garet font-bold text-purple tracking-normal shrink-0">
                                    {ambito?.geografico || 'Jalisco'}
                                    {ambito?.temporal && <span className="text-orange"> {ambito.temporal}</span>}
                                </p>
                            )}
                        </div>

                        <AccionesEncabezado
                            modo={modo}
                            onModo={abrirModo}
                            dinamica={dinamica}
                            onMinimizar={alternarMinimizado}
                            onCerrar={attach}
                        />
                    </div>

                    {creando && (
                        <Constructor
                            catalogo={catalogo}
                            definicion={borrador}
                            onDefinicion={setBorrador}
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
                                onIndice={setIndiceRanking}
                                porcentaje={rankingPorcentaje}
                                onPorcentaje={setRankingPorcentaje}
                                resaltadas={resaltadas}
                            />
                        ) : (
                            <p className="text-[11px]/[14px] font-garet text-[#8894AE] py-2">
                                {cargandoRanking ? 'Calculando…' : 'Esta capa no se puede agrupar por municipio.'}
                            </p>
                        )
                    )}

                    {comparando && (
                        <ComparadorTabla
                            columnas={columnasConNombre}
                            filas={filas}
                            modo={orden}
                            onModo={setOrden}
                            onQuitar={quitarComparado}
                            picker={picker}
                            vacio={cargando ? 'Calculando…' : 'Elige un municipio para comparar.'}
                        />
                    )}

                    {modo === 'resumen' && (
                        <TarjetasResumen slots={slots} propias={valoresPropios} onQuitarPropia={quitar} />
                    )}
                </section>
            )}
        </div>
    );
};

export default NumeraliaPanel;
