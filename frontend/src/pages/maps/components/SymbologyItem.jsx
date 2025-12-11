import { useState, useEffect } from 'react';
import { useWMSLegend } from '../hooks/useWMSLegend';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';

const SymbologyItem = ({
    layer,
    isExpanded,
    onToggle,
    showDivider = true,
    prefix = null,
    simple = false,
    onClick = null
}) => {
    const { getLegendUrl, hasLegend } = useWMSLegend();
    const [loadingSymbology, setLoadingSymbology] = useState(false);
    const [symbologyError, setSymbologyError] = useState(null);

    useEffect(() => {
        if (isExpanded && layer && !simple) {
            setLoadingSymbology(true);
            setSymbologyError(null);

            const timer = setTimeout(() => {
                setLoadingSymbology(false);
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [isExpanded, layer?.id, simple]);

    if (!layer) return null;

    const hasLayerLegend = hasLegend(layer);
    const legendUrl = hasLayerLegend ? getLegendUrl(layer) : null;

    const handleClick = (e) => {
        if (simple && onClick) {
            onClick(e);
        } else {
            onToggle(e);
        }
    };

    return (
        <div className={`${showDivider ? 'border-b border-gray-200' : ''}`}>
            <button
                onClick={handleClick}
                className="w-full pl-2 pr-2 py-1.5 flex items-center justify-between hover:bg-gray-50  transition-colors text-left"
            >
                <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
                    {prefix && (
                        <div onClick={(e) => e.stopPropagation()} className="shrink-0 flex items-center">
                            {prefix}
                        </div>
                    )}
                    <Tooltip content={layer.label} placement="top" delay={500}>
                        <div className="text-sm font-medium text-gray-900  truncate">
                            {layer.label}
                        </div>
                    </Tooltip>
                    {!simple && loadingSymbology && (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 shrink-0"></div>
                    )}
                </div>
                {!simple && (
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                        {!loadingSymbology && hasLayerLegend && (
                            <span className="text-green-500" style={{ fontSize: '10px' }}>
                                <Icon name="check" />
                            </span>
                        )}
                        {!loadingSymbology && !hasLayerLegend && (
                            <span className="text-gray-400" style={{ fontSize: '10px' }}>
                                <Icon name="info" />
                            </span>
                        )}
                        <span
                            className={`
                                text-gray-500  transition-transform duration-200
                                ${isExpanded ? 'rotate-180' : ''}
                            `}
                            style={{ fontSize: '12px' }}
                        >
                            <Icon name="chevron_down" />
                        </span>
                    </div>
                )}
            </button>

            {isExpanded && (
                <div className="px-2 pb-2">
                    {symbologyError && (
                        <div className="bg-red-50  border border-red-200  text-red-700  px-2 py-1 rounded text-center">
                            <p className="text-xs">{symbologyError}</p>
                        </div>
                    )}

                    {loadingSymbology && (
                        <div className="flex items-center justify-center py-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            <span className="ml-2 text-xs text-gray-600 ">
                                Cargando...
                            </span>
                        </div>
                    )}

                    {!loadingSymbology && hasLayerLegend && legendUrl && (
                        <div className="bg-white  p-1 rounded border border-gray-200 ">
                            <img
                                src={legendUrl}
                                alt={`Leyenda de ${layer.label}`}
                                className="max-w-full h-auto"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                    setSymbologyError('Error cargando imagen de leyenda');
                                }}
                                onLoad={() => setSymbologyError(null)}
                            />
                            <div
                                style={{ display: 'none' }}
                                className="text-red-500 text-xs p-2 text-center"
                            >
                                ❌ Error cargando leyenda
                            </div>
                        </div>
                    )}

                    {!loadingSymbology && !hasLayerLegend && (
                        <div className="text-center py-2 text-gray-500 ">
                            <div className="text-lg mb-1">📄</div>
                            <p className="text-xs">
                                Sin simbología WMS
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SymbologyItem;
