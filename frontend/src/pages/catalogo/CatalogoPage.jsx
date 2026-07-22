import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import CatalogoMapView from './components/CatalogoMapView';
import CatalogoSearchModal from './components/CatalogoSearchModal';
import CatalogoLegends from './components/CatalogoLegends';
import CatalogoBackButton from './components/CatalogoBackButton';
import { fetchCatalogoCapas, fetchCatalogoCapa } from '@services/catalogoService';

const CatalogoPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [capas, setCapas] = useState([]);
    const [selectedCapa, setSelectedCapa] = useState(null);
    const [searchOpen, setSearchOpen] = useState(false);

    useEffect(() => {
        const ctrl = new AbortController();
        fetchCatalogoCapas(ctrl.signal).then(setCapas).catch(() => {});
        return () => ctrl.abort();
    }, []);

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
                    }
                })
                .catch(() => {});
        } else {
            setSelectedCapa(null);
            setSearchOpen(true);
        }
        return () => ctrl.abort();
    }, [slug]);

    const handleSelect = (nextSlug) => {
        setSearchOpen(false);
        navigate(`/catalogo/${nextSlug}`);
    };

    const handleCloseCapa = () => {
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
