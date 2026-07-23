import { useEffect, useMemo, useState } from 'react';
import { hydrateWmsConfig } from '@pages/maps/helpers/wmsConfig';
import { downloadCatalogoCapa } from '@services/downloadService';
import { capaHasGeometry } from '@services/catalogoService';
import LegendImage from '@components/LegendImage';
import { trackCatalogoDownload } from '@services/analyticsService';

const LEGEND_ICON = 20;

const buildLegendUrl = (cfg) => {
    const legendOptions = [
        'fontName:Garet Regular',
        'fontSize:10',
        'fontStyle:normal',
        'fontAntiAliasing:true',
        'fontColor:0x454545',
        'labelMargin:12',
        'dpi:100',
        'forceLabels:on',
    ].join(';');
    return (
        `${cfg.baseUrl}?service=WMS&version=1.1.0&request=GetLegendGraphic`
        + `&layer=${encodeURIComponent(cfg.layerName)}&format=image/png`
        + `&width=${LEGEND_ICON}&height=${LEGEND_ICON}`
        + `&LEGEND_OPTIONS=${encodeURIComponent(legendOptions)}`
    );
};

const ICON_BTN = 'size-8 rounded-full flex items-center justify-center transition-colors';

const CatalogoLegends = ({ capa, onClose }) => {
    const [minimized, setMinimized] = useState(false);
    const [showShp, setShowShp] = useState(true);
    const [showFormats, setShowFormats] = useState(false);
    const [downloading, setDownloading] = useState(null);

    const cfg = useMemo(
        () => hydrateWmsConfig({ geoserverWorkspace: capa.geoserverWorkspace, geoserverLayer: capa.geoserverLayer }),
        [capa],
    );
    const legendUrl = useMemo(() => (cfg ? buildLegendUrl(cfg) : null), [cfg]);

    useEffect(() => {
        let active = true;
        const ctrl = new AbortController();
        setShowShp(true);
        setShowFormats(false);
        capaHasGeometry(capa, ctrl.signal).then((has) => {
            if (active) setShowShp(has);
        });
        return () => {
            active = false;
            ctrl.abort();
        };
    }, [capa]);

    const handleDownload = async (formatId) => {
        trackCatalogoDownload({ slug: capa.slug, format: formatId });
        setDownloading(formatId);
        await downloadCatalogoCapa(capa, formatId);
        setDownloading(null);
    };

    const toggleMinimized = () => setMinimized((m) => !m);

    const formats = [
        { id: 'geopackage', label: 'GPKG' },
        { id: 'shape-zip', label: 'SHP', hidden: !showShp },
        { id: 'csv', label: 'CSV' },
    ].filter((f) => !f.hidden);

    return (
        <div className="fixed top-4 right-4 z-20 w-[min(240px,50vw)] md:w-[min(272px,72vw)] bg-white rounded-[14px] shadow-[0_5px_20px_#1A26641A] overflow-hidden">
            <div
                role="button"
                tabIndex={0}
                onClick={toggleMinimized}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMinimized(); } }}
                title={minimized ? 'Expandir' : 'Minimizar'}
                className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-2.5 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-purple/40"
            >
                <h3 className="min-w-0 wrap-break-word text-[15px] font-bold text-purple font-garet leading-tight">{capa.nombre}</h3>
                <span className={`hidden md:flex shrink-0 text-purple ${ICON_BTN}`}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        {minimized ? <path d="M12 6v12M6 12h12" /> : <path d="M6 12h12" />}
                    </svg>
                </span>
            </div>

            {!minimized && (
                <div className="px-3.5 pb-3">
                    {legendUrl && (
                        <div className="relative w-full bg-white rounded-[13px] p-2 max-h-[52vh] overflow-y-auto">
                            <LegendImage src={legendUrl} alt={capa.nombre} />
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-3">
                        <button
                            onClick={() => setShowFormats((v) => !v)}
                            className="px-4 py-1.5 rounded-[30px] text-[12px] font-garet font-bold bg-purple-deep text-white hover:bg-purple transition-colors"
                        >
                            Descargar
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
                                    className="text-[12px] font-garet px-3 py-1.5 rounded-[14px] border border-purple-deep text-purple-deep hover:bg-purple-deep hover:text-white transition-colors disabled:opacity-50"
                                >
                                    {downloading === f.id ? '…' : f.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CatalogoLegends;
