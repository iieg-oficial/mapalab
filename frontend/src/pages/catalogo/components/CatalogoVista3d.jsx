import { lazy, Suspense } from 'react';
import { useView3d } from '@contexts/View3dContext';

const Map3DView = lazy(() => import('@mapsComponents/Map3D/Map3DView'));

const CatalogoVista3d = ({ consultar }) => {
    const { active } = useView3d();
    if (!active) return null;
    return (
        <Suspense fallback={null}>
            <Map3DView consultar={consultar} />
        </Suspense>
    );
};

export default CatalogoVista3d;
