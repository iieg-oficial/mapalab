import { useEffect, useMemo, useState } from 'react';
import { hydrateWmsConfig } from '@pages/maps/helpers/wmsConfig';
import { buildLegendGraphicUrl } from '@pages/maps/helpers/legendUrl';
import { downloadCatalogoCapa, RASTER_FORMATS } from '@services/downloadService';
import { capaHasGeometry } from '@services/catalogoService';
import LegendImage from '@components/LegendImage';
import CatalogoShare from './CatalogoShare';
import { CatalogoHexbinLeyenda, CatalogoVistaSegmented } from './CatalogoVista';
import { hexbinDisponible } from '../hooks/useCatalogoHexbin';
import { PARAM_VISTA, VISTA_HEXAGONOS, VISTA_PUNTOS } from '../helpers/catalogoVista';
import { buildCatalogoShareUrl, filtroToFechaParam } from '../helpers/catalogoRoutes';
import { useCatalogoTiempoContext } from '../hooks/catalogoTiempoContext';
import { trackCatalogoDownload, trackCatalogoShare } from '@services/analyticsService';

const ICON_BTN = 'size-7 rounded-full flex items-center justify-center transition-colors';

const CatalogoLegends = ({ capa, institucionSlug = null, vista = VISTA_PUNTOS, onVista = null, hexbin = null, onClose }) => {
    const { tiempo } = useCatalogoTiempoContext();
    const filtro = tiempo?.filtro || null;
    const isRaster = !!tiempo?.isRaster;
    const periodicidad = tiempo?.periodicidad || null;
    const cqlFiltro = isRaster ? null : tiempo?.filtroMapa || null;
    const [minimized, setMinimized] = useState(false);
    const [showShp, setShowShp] = useState(true);
    const [showFormats, setShowFormats] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [downloading, setDownloading] = useState(null);

    const cfg = useMemo(
        () => hydrateWmsConfig({ geoserverWorkspace: capa.geoserverWorkspace, geoserverLayer: capa.geoserverLayer }),
        [capa],
    );
    const legendUrl = useMemo(
        () => (cfg ? buildLegendGraphicUrl({
            baseUrl: cfg.baseUrl,
            layerName: cfg.layerName,
            cqlFilter: cqlFiltro,
            hideEmptyRules: true,
        }) : null),
        [cfg, cqlFiltro],
    );

    const conVista = !!onVista && hexbinDisponible(capa, tiempo);

    const shareUrl = useMemo(() => {
        const base = buildCatalogoShareUrl({ institucionSlug, capaSlug: capa.slug });
        const params = new URLSearchParams();
        const fecha = filtroToFechaParam(filtro, { isRaster, periodicidad });
        if (fecha) params.set('fecha', fecha);
        if (conVista && vista === VISTA_HEXAGONOS) params.set(PARAM_VISTA, VISTA_HEXAGONOS);
        const consulta = params.toString();
        return consulta ? `${base}?${consulta}` : base;
    }, [institucionSlug, capa.slug, filtro, isRaster, periodicidad, conVista, vista]);

    useEffect(() => {
        let active = true;
        const ctrl = new AbortController();
        setShowShp(true);
        setShowFormats(false);
        setShowShare(false);
        if (isRaster) return undefined;
        capaHasGeometry(capa, ctrl.signal).then((has) => {
            if (active) setShowShp(has);
        });
        return () => {
            active = false;
            ctrl.abort();
        };
    }, [capa, isRaster]);

    const handleDownload = async (formatId) => {
        trackCatalogoDownload({ slug: capa.slug, format: formatId });
        setDownloading(formatId);
        await downloadCatalogoCapa(capa, formatId, {
            cqlFilter: cqlFiltro,
            timeValue: isRaster ? filtro : null,
            rasterPeriodicity: isRaster ? periodicidad : null,
        });
        setDownloading(null);
    };

    const toggleMinimized = () => setMinimized((m) => !m);

    const formats = isRaster
        ? RASTER_FORMATS.map((f) => ({ id: f.id, label: f.label }))
        : [
            { id: 'geopackage', label: 'GPKG' },
            { id: 'shape-zip', label: 'SHP', hidden: !showShp },
            { id: 'csv', label: 'CSV' },
        ].filter((f) => !f.hidden);

    return (
        <div className={`fixed top-4 right-4 ${minimized ? 'z-20 w-[min(240px,50vw)] rounded-full md:rounded-[14px]' : 'z-21 w-[calc(100vw-2rem)] rounded-[14px]'} md:w-[min(272px,72vw)] bg-white shadow-[0_5px_20px_#1A26641A] overflow-hidden`}>
            <div
                role="button"
                tabIndex={0}
                onClick={toggleMinimized}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMinimized(); } }}
                title={minimized ? 'Expandir' : 'Minimizar'}
                className="flex items-center justify-between gap-2 min-h-10 px-3.5 py-1.5 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-purple/40"
            >
                <h3
                    title={minimized ? capa.nombre : undefined}
                    className={`min-w-0 text-[15px] font-bold text-purple font-garet leading-tight ${minimized ? 'truncate md:whitespace-normal md:wrap-break-word' : 'wrap-break-word'}`}
                >
                    {capa.nombre}
                </h3>
                <span className={`${minimized ? 'hidden md:flex' : 'flex'} shrink-0 text-purple ${ICON_BTN}`}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        {minimized ? <path d="M12 6v12M6 12h12" /> : <path d="M6 12h12" />}
                    </svg>
                </span>
            </div>

            {!minimized && (
                <div className="px-3.5 pb-3">
                    {conVista && <CatalogoVistaSegmented nombre={capa.nombre} vista={vista} onVista={onVista} />}
                    {hexbin ? <CatalogoHexbinLeyenda hexbin={hexbin} /> : legendUrl && (
                        <div className="relative w-full bg-white rounded-[13px] p-2 max-h-[52vh] overflow-y-auto">
                            <LegendImage src={legendUrl} alt={capa.nombre} />
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-3">
                        <button
                            onClick={() => { setShowFormats((v) => !v); setShowShare(false); }}
                            className="px-4 py-1.5 rounded-[30px] text-[12px] font-garet font-bold bg-purple-deep text-white hover:bg-purple transition-colors"
                        >
                            Descargar
                        </button>
                        <button
                            onClick={() => { setShowShare((v) => !v); setShowFormats(false); }}
                            className={`px-4 py-1.5 rounded-[30px] text-[12px] font-garet font-bold border border-purple-deep transition-colors ${showShare ? 'bg-purple-deep text-white' : 'text-purple-deep hover:bg-purple-deep hover:text-white'}`}
                        >
                            Compartir
                        </button>
                        <button
                            onClick={onClose}
                            title="Cerrar capa"
                            aria-label="Cerrar capa"
                            className={`ml-auto ${ICON_BTN} hover:bg-black/5`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-4.25 h-4.25">
                                <g fill="none">
                                    <path stroke="#ff577d" strokeLinecap="round" strokeLinejoin="round" d="M3.019 4.68h9.962" />
                                    <path stroke="#ff577d" strokeLinecap="round" strokeLinejoin="round" d="M11.874 4.68v7.748a1.107 1.107 0 0 1-1.107 1.107H5.233a1.107 1.107 0 0 1-1.107-1.107V4.68m1.66 0V3.573a1.107 1.107 0 0 1 1.107-1.107h2.214a1.107 1.107 0 0 1 1.107 1.107V4.68" />
                                    <path stroke="#ff577d" strokeLinecap="round" strokeLinejoin="round" d="M6.893 7.447v3.321" />
                                    <path stroke="#ff577d" strokeLinecap="round" strokeLinejoin="round" d="M9.107 7.447v3.321" />
                                </g>
                            </svg>
                        </button>
                    </div>

                    {showFormats && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {formats.map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => handleDownload(f.id)}
                                    disabled={downloading === f.id}
                                    className="text-[12px] font-garet px-3 py-1.5 rounded-[14px] border border-orange text-orange hover:bg-orange hover:text-white transition-colors disabled:opacity-50"
                                >
                                    {downloading === f.id ? '…' : f.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {showShare && (
                        <CatalogoShare
                            url={shareUrl}
                            filename={`mapalab-${capa.slug}`}
                            onShare={(type) => trackCatalogoShare({ scope: 'capa', slug: capa.slug, type })}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default CatalogoLegends;
