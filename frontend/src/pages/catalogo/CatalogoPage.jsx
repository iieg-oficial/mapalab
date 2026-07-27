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
import { fechaParamToCql, cqlToFechaParam } from './helpers/catalogoRoutes';
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

const IS_NON_PROD = ['dev', 'beta'].includes(import.meta.env.VITE_APP_ENV);

const CatalogoPage = () => {
    const { seg1, seg2 } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialFilterRef = useRef(fechaParamToCql(searchParams.get('fecha')));
    const [capas, setCapas] = useState([]);
    const [instituciones, setInstituciones] = useState([]);
    const [listasCargadas, setListasCargadas] = useState(false);
    const [selectedCapa, setSelectedCapa] = useState(null);
    const [institucionSlug, setInstitucionSlug] = useState(null);
    const [searchOpen, setSearchOpen] = useState(false);
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
            setSelectedCapa(local);
            setSearchOpen(false);
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
        navigate(buildCatalogoPath({ institucionSlug, capaSlug: nextSlug }));
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
        navigate(buildCatalogoPath({ institucionSlug: slug }));
    }, [capas, navigate]);

    const handleEditInfobox = useCallback((capa, feature = null) => {
        if (!capa) return;
        trackCatalogoInfoboxEditorOpen(capa.slug);
        setCapaEnEdicion({ capa, feature });
    }, []);

    const handleFilterChange = useCallback((cql) => {
        initialFilterRef.current = null;
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            const param = cqlToFechaParam(cql);
            if (param) next.set('fecha', param);
            else next.delete('fecha');
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    return (
        <div className="fixed inset-0 overflow-hidden bg-[#EAE7E0]">
            <LayerLoadingProvider>
                <CatalogoTiempoProvider
                    capa={selectedCapa}
                    initialFilter={initialFilterRef.current}
                    onFilterChange={handleFilterChange}
                >
                    <CatalogoMapView
                        capa={selectedCapa}
                        onEditInfobox={IS_NON_PROD ? (feature) => handleEditInfobox(selectedCapa, feature) : null}
                    />
                    {selectedCapa && (
                        <CatalogoLegends
                            capa={selectedCapa}
                            institucionSlug={institucionSlug}
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
                onEditInfobox={IS_NON_PROD ? (capa) => handleEditInfobox(capa) : null}
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
