import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import CatalogoMapView from './components/CatalogoMapView';
import CatalogoSearchModal from './components/CatalogoSearchModal';
import CatalogoLegends from './components/CatalogoLegends';
import CatalogoBackButton from './components/CatalogoBackButton';
import { fetchCatalogoCapas, fetchCatalogoCapa } from '@services/catalogoService';
import {
    trackCatalogoOpen,
    trackCatalogoLayerSelect,
    trackCatalogoLayerClose,
    trackCatalogoSlugNotFound,
} from '@services/analyticsService';
import { CATALOGO_RETURN_KEY } from './useGoToCatalogo';

const CatalogoPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [capas, setCapas] = useState([]);
    const [selectedCapa, setSelectedCapa] = useState(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const openTrackedRef = useRef(false);

    useEffect(() => {
        const ctrl = new AbortController();
        fetchCatalogoCapas(ctrl.signal).then(setCapas).catch(() => {});
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
        trackCatalogoOpen({ from: hasReturn ? 'visor' : 'directo', slug: slug || null });
    }, [slug]);

    useEffect(() => {
        const ctrl = new AbortController();
        if (slug) {
            fetchCatalogoCapa(slug, ctrl.signal)
                .then((capa) => {
                    if (capa) {
                        setSelectedCapa(capa);
                        setSearchOpen(false);
                    } else {
                        setSelectedCapa(null);
                        setSearchOpen(true);
                        trackCatalogoSlugNotFound(slug);
                    }
                })
                .catch(() => {});
        } else {
            setSelectedCapa(null);
            setSearchOpen(true);
        }
        return () => ctrl.abort();
    }, [slug]);

    const handleSelect = (nextSlug, { fromSearch = false } = {}) => {
        trackCatalogoLayerSelect({ slug: nextSlug, fromSearch });
        setSearchOpen(false);
        navigate(`/catalogo/${nextSlug}`);
    };

    const handleCloseCapa = () => {
        trackCatalogoLayerClose(selectedCapa?.slug || null);
        setSelectedCapa(null);
        setSearchOpen(true);
        navigate('/catalogo');
    };

    return (
        <div className="fixed inset-0 overflow-hidden bg-[#EAE7E0]">
            <CatalogoMapView capa={selectedCapa} />
            <CatalogoBackButton />
            {selectedCapa && <CatalogoLegends capa={selectedCapa} onClose={handleCloseCapa} />}
            <CatalogoSearchModal
                capas={capas}
                open={searchOpen}
                onOpen={() => setSearchOpen(true)}
                onClose={() => setSearchOpen(false)}
                onSelect={handleSelect}
            />
        </div>
    );
};

export default CatalogoPage;
