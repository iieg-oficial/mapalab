import { useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { BASEMAPS } from '@pages/maps/helpers/basemaps';
import ReportButton from '@components/ReportButton';
import CatalogoEntryButton from './CatalogoEntryButton';
import { useAreaUtil } from '@contexts/AreaUtilContext';

const ENLACE = 'text-[#8936AB] hover:underline hover:text-[#5C2472]';

const ENLACES = [
    { texto: 'OpenStreetMap', href: 'https://www.openstreetmap.org/copyright', copy: true },
    { texto: 'CARTO', href: 'https://carto.com/attributions', copy: true },
    { texto: 'OpenLayers', href: 'https://openlayers.org', copy: true },
    { texto: 'MapLibre', href: 'https://maplibre.org', copy: true },
    { texto: 'Leaflet', href: 'https://leafletjs.com', copy: true },
    { texto: 'GeoServer', href: 'https://geoserver.org', copy: true },
    { texto: 'PostGIS', href: 'https://postgis.net', copy: true },
    { texto: 'Licencias de software', href: `${import.meta.env.BASE_URL}licencias.txt`, copy: false },
    { texto: 'Licencia IIEG 2026', href: 'https://iieg.gob.mx/ns/wp-content/uploads/2026/04/declaracion_de_licencia_de_uso_atribuciones_de_informacion_publica_del_IIEG_2026.pdf', copy: false },
];

const MapAttribution = ({ hideCatalogo = false, origenReporte = 'map_attribution', compact = false, extraRight = null }) => {
    const { margenes } = useAreaUtil();
    const { baseMapId } = useMapsContext();
    const basemapConfig = BASEMAPS[baseMapId];
    const [open, setOpen] = useState(false);

    if (!basemapConfig || basemapConfig.id === 'sin_mapalab') return null;

    return (
        <div
            data-atribucion
            className="fixed bottom-4 right-4 md:bottom-2 md:right-2 z-10 flex items-center gap-2"
            style={{ marginRight: margenes.right, marginBottom: margenes.bottom }}
        >
            <ReportButton variant="floating" label="Reportar problema o sugerencia" extraContext={{ source: origenReporte }} />
            {!hideCatalogo && <CatalogoEntryButton />}
            <div className={`${compact ? 'hidden' : 'hidden md:flex'} justify-end rounded-[20px] bg-[#FFFFFF] px-3 py-1 font-[Garet,sans-serif] font-medium text-[12px] leading-[16px] tracking-[0px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)] text-[#6E7477] whitespace-nowrap group transition-all duration-300 ease-in-out cursor-default overflow-hidden`}>
                <span>Contribuciones ©</span>
                <span className="max-w-0 opacity-0 group-hover:max-w-[1000px] group-hover:opacity-100 group-hover:ml-1 transition-all duration-300 ease-in-out inline-flex items-center">
                    {ENLACES.map(({ texto, href, copy }, i) => (
                        <span key={texto} className="inline-flex items-center">
                            {i > 0 && <>&nbsp;|&nbsp;</>}
                            {copy && i > 0 && '© '}
                            <a href={href} target="_blank" rel="noopener noreferrer" className={`${ENLACE} ${i > 0 ? 'ml-1' : ''}`}>{texto}</a>
                        </span>
                    ))}
                </span>
            </div>

            <div className={`${compact ? '' : 'md:hidden'} relative`}>
                {open && (
                    <div className="absolute bottom-full right-0 mb-2 rounded-[12px] bg-[#FFFFFF] px-3 py-2 font-[Garet,sans-serif] font-medium text-[11px] leading-[18px] text-[#6E7477] whitespace-nowrap shadow-md">
                        {ENLACES.map(({ texto, href, copy }) => (
                            <a key={texto} href={href} target="_blank" rel="noopener noreferrer" className={`${ENLACE} flex items-center gap-1.5 py-1.5 my-0.5`}>
                                {copy ? `© ${texto}` : texto}
                            </a>
                        ))}
                    </div>
                )}
                {compact && (
                    <button
                        onClick={() => setOpen(prev => !prev)}
                        aria-expanded={open}
                        className="hidden md:block rounded-[20px] bg-[#FFFFFF] px-3 py-1 font-[Garet,sans-serif] font-medium text-[12px] leading-[16px] text-[#6E7477] whitespace-nowrap shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)]"
                    >
                        Contribuciones ©
                    </button>
                )}
                <button
                    onClick={() => setOpen(prev => !prev)}
                    aria-expanded={open}
                    className={`${compact ? 'md:hidden ' : ''}w-7 h-7 rounded-full bg-[#FFFFFF] flex items-center justify-center font-[Garet,sans-serif] font-medium text-[16px] text-[#6E7477] shadow-sm`}
                >
                    ©
                </button>
            </div>

            {extraRight}
        </div>
    );
};

export default MapAttribution;
