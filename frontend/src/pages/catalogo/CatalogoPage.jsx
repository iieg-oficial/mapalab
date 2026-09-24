import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import CatalogoMapView from './components/CatalogoMapView';
import CatalogoSearchModal from './components/CatalogoSearchModal';
import CatalogoLegends from './components/CatalogoLegends';
import CatalogoBackButton from './components/CatalogoBackButton';
import CatalogoInfoBoxEditor from './components/CatalogoInfoBoxEditor';
import LottieSpinner from '@components/LottieSpinner';
import { LayerLoadingProvider } from '@contexts/LayerLoadingContext';
import { CatalogoTiempoProvider } from './hooks/CatalogoTiempoProvider';
import {
    fetchCatalogoCapas,
    fetchCatalogoCapa,
    fetchCatalogoInstituciones,
} from '@services/catalogoService';
import {
    trackCatalogoOpen,
    trackCatalogoLayerSelect,
    trackCatalogoLayerClose,
    trackCatalogoSlugNotFound,
    trackCatalogoInstitucionSelect,
    trackCatalogoInfoboxEditorOpen,
} from '@services/analyticsService';
import { CATALOGO_RETURN_KEY } from './useGoToCatalogo';
import { buildCatalogoPath, filterCapas, resolveCatalogoRoute } from './helpers/catalogoRoutes';
import { PARAM_VISTA, VISTA_HEXAGONOS, vistaDeParam } from './helpers/catalogoVista';
import { PARAM_MUNICIPIOS } from './hooks/useCatalogoMunicipio';
import { useIsNonProd } from '@hooks/useDevTools';

const CatalogoPage = () => {
    const isNonProd = useIsNonProd();
    const { seg1, seg2 } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialFechaRef = useRef(searchParams.get('fecha'));
    const initialMunicipiosRef = useRef(searchParams.get(PARAM_MUNICIPIOS));
    const [capas, setCapas] = useState([]);
    const [instituciones, setInstituciones] = useState([]);
    const [listasCargadas, setListasCargadas] = useState(false);
    const [selectedCapa, setSelectedCapa] = useState(null);
    const capaVigenteRef = useRef(null);
    capaVigenteRef.current = selectedCapa?.slug || null;
    const [institucionSlug, setInstitucionSlug] = useState(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [hexbin, setHexbin] = useState(null);
    const [imagenAbierta, setImagenAbierta] = useState(false);
    const [loadingCapa, setLoadingCapa] = useState(false);
    const [capaEnEdicion, setCapaEnEdicion] = useState(null);
    const openTrackedRef = useRef(false);

    useEffect(() => {
        const ctrl = new AbortController();
        Promise.all([
            fetchCatalogoCapas(ctrl.signal).catch(() => []),
            fetchCatalogoInstituciones(ctrl.signal).catch(() => []),
        ]).then(([nextCapas, nextInstituciones]) => {
            setCapas(nextCapas);
            setInstituciones(nextInstituciones);
            setListasCargadas(true);
        });
        return () => ctrl.abort();
    }, []);

    useEffect(() => {
        if (openTrackedRef.current) return;
        openTrackedRef.current = true;
        let hasReturn;
        try {
            hasReturn = !!sessionStorage.getItem(CATALOGO_RETURN_KEY);
        } catch {
            hasReturn = false;
        }
        trackCatalogoOpen({ from: hasReturn ? 'visor' : 'directo', slug: seg2 || seg1 || null });
    }, [seg1, seg2]);

    useEffect(() => {
        if (!listasCargadas) return undefined;
        const ctrl = new AbortController();
        const resolved = resolveCatalogoRoute(seg1, seg2, capas, instituciones);
        setInstitucionSlug(resolved.institucionSlug);

        if (!resolved.capaSlug) {
            setSelectedCapa(null);
            setSearchOpen(true);
            if (resolved.notFound) trackCatalogoSlugNotFound(seg1);
            return undefined;
        }

        const local = capas.find((capa) => capa.slug === resolved.capaSlug);
        if (local) {
            if (capaVigenteRef.current !== local.slug) setSearchOpen(false);
            setSelectedCapa(local);
            return undefined;
        }

        setLoadingCapa(true);
        fetchCatalogoCapa(resolved.capaSlug, ctrl.signal)
            .then((capa) => {
                if (capa) {
                    setSelectedCapa(capa);
                    setSearchOpen(false);
                } else {
                    setSelectedCapa(null);
                    setSearchOpen(true);
                    trackCatalogoSlugNotFound(resolved.capaSlug);
                }
            })
            .catch(() => {})
            .finally(() => setLoadingCapa(false));

        return () => ctrl.abort();
    }, [listasCargadas, capas, instituciones, seg1, seg2]);

    const capasVisibles = useMemo(
        () => filterCapas(capas, { institucionSlug }),
        [capas, institucionSlug],
    );

    const institucionActiva = useMemo(
        () => instituciones.find((i) => i.slug === institucionSlug) || null,
        [instituciones, institucionSlug],
    );

    const conteosPorInstitucion = useMemo(() => capas.reduce((acc, capa) => {
        const slug = capa.institucion?.slug;
        if (slug) acc[slug] = (acc[slug] || 0) + 1;
        return acc;
    }, {}), [capas]);

    const handleSelect = (nextSlug, { fromSearch = false } = {}) => {
        trackCatalogoLayerSelect({ slug: nextSlug, fromSearch });
        setSearchOpen(false);
        const ruta = buildCatalogoPath({ institucionSlug, capaSlug: nextSlug });
        const municipios = searchParams.get(PARAM_MUNICIPIOS);
        navigate(municipios ? `${ruta}?${PARAM_MUNICIPIOS}=${municipios}` : ruta);
    };

    const handleCloseCapa = () => {
        trackCatalogoLayerClose(selectedCapa?.slug || null);
        setSelectedCapa(null);
        setSearchOpen(true);
        navigate(buildCatalogoPath({ institucionSlug }));
    };

    const handleSelectInstitucion = useCallback((slug) => {
        const total = slug ? filterCapas(capas, { institucionSlug: slug }).length : capas.length;
        trackCatalogoInstitucionSelect({ slug, capas: total });
        const ruta = buildCatalogoPath({ institucionSlug: slug, capaSlug: capaVigenteRef.current });
        const consulta = capaVigenteRef.current ? searchParams.toString() : '';
        navigate(consulta ? `${ruta}?${consulta}` : ruta);
    }, [capas, navigate, searchParams]);

    const handleEditInfobox = useCallback((capa, feature = null) => {
        if (!capa) return;
        trackCatalogoInfoboxEditorOpen(capa.slug);
        setCapaEnEdicion({ capa, feature });
    }, []);

    const handleFechaChange = useCallback((param) => {
        initialFechaRef.current = null;
        setSearchParams((prev) => {
            if ((prev.get('fecha') || null) === (param || null)) return prev;
            const next = new URLSearchParams(prev);
            if (param) next.set('fecha', param);
            else next.delete('fecha');
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const handleMunicipiosChange = useCallback((param) => {
        initialMunicipiosRef.current = null;
        setSearchParams((prev) => {
            if ((prev.get(PARAM_MUNICIPIOS) || null) === (param || null)) return prev;
            const next = new URLSearchParams(prev);
            if (param) next.set(PARAM_MUNICIPIOS, param);
            else next.delete(PARAM_MUNICIPIOS);
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const vista = vistaDeParam(searchParams.get(PARAM_VISTA));
    const hexagonos = isNonProd && vista === VISTA_HEXAGONOS;
    const cambiarVista = useCallback((siguiente) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (siguiente === VISTA_HEXAGONOS) next.set(PARAM_VISTA, VISTA_HEXAGONOS);
            else next.delete(PARAM_VISTA);
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    return (
        <div className="fixed inset-0 overflow-hidden bg-[#EAE7E0]">
            <LayerLoadingProvider>
                <CatalogoTiempoProvider
                    capa={selectedCapa}
                    initialFecha={initialFechaRef.current}
                    onFechaChange={handleFechaChange}
                    initialMunicipios={isNonProd ? initialMunicipiosRef.current : null}
                    onMunicipiosChange={handleMunicipiosChange}
                >
                    <CatalogoMapView
                        capa={selectedCapa}
                        hexagonos={hexagonos}
                        onHexbin={setHexbin}
                        imagenAbierta={imagenAbierta}
                        onCerrarImagen={() => setImagenAbierta(false)}
                        onEditInfobox={isNonProd ? (feature) => handleEditInfobox(selectedCapa, feature) : null}
                    />
                    {selectedCapa && (
                        <CatalogoLegends
                            capa={selectedCapa}
                            institucionSlug={institucionSlug}
                            vista={vista}
                            onVista={isNonProd ? cambiarVista : null}
                            hexbin={hexagonos ? hexbin : null}
                            onImagen={() => setImagenAbierta(true)}
                            onClose={handleCloseCapa}
                        />
                    )}
                </CatalogoTiempoProvider>
            </LayerLoadingProvider>
            {seg1 && (loadingCapa || !listasCargadas) && (
                <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-20">
                    <LottieSpinner loop autoplay className="w-32 h-32" />
                </div>
            )}
            <CatalogoBackButton />
            <CatalogoSearchModal
                capas={capasVisibles}
                instituciones={instituciones}
                institucionActiva={institucionActiva}
                conteosPorInstitucion={conteosPorInstitucion}
                totalCapas={capas.length}
                onSelectInstitucion={handleSelectInstitucion}
                open={searchOpen}
                onOpen={() => setSearchOpen(true)}
                onClose={() => setSearchOpen(false)}
                onSelect={handleSelect}
                onEditInfobox={isNonProd ? (capa) => handleEditInfobox(capa) : null}
            />
            {capaEnEdicion && (
                <CatalogoInfoBoxEditor
                    capa={capaEnEdicion.capa}
                    featureMuestra={capaEnEdicion.feature}
                    onClose={() => setCapaEnEdicion(null)}
                />
            )}
        </div>
    );
};

export default CatalogoPage;
