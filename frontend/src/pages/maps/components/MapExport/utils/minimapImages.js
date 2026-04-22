import federalVoyager from '@assets/images/minimap_federal_voyager.webp';
import federalPositron from '@assets/images/minimap_federal_positron.webp';
import federalSinMapa from '@assets/images/minimap_federal_sin_mapa.webp';
import estatalVoyager from '@assets/images/minimap_estatal_voyager.webp';
import estatalPositron from '@assets/images/minimap_estatal_positron.webp';
import estatalSinMapa from '@assets/images/minimap_estatal_sin_mapa.webp';

const MINIMAP_IMAGES = {
    voyager:    { federal: federalVoyager,  estatal: estatalVoyager  },
    position:   { federal: federalPositron, estatal: estatalPositron },
    sin_mapalab:{ federal: federalSinMapa,  estatal: estatalSinMapa  }
};

const MINIMAP_BOUNDS = {
    federal: [-120.0, 13.5, -85.0, 33.0],
    estatal: [-105.70, 18.95, -101.47, 22.75]
};

const MIN_ZOOM = 8;

export const getMinimapImage = (baseMapId, viewType, zoom) => {
    const level = (viewType === 'full-state' || zoom <= MIN_ZOOM) ? 'federal' : 'estatal';
    const basemap = MINIMAP_IMAGES[baseMapId] || MINIMAP_IMAGES.voyager;
    return { url: basemap[level], bounds: MINIMAP_BOUNDS[level] };
};
