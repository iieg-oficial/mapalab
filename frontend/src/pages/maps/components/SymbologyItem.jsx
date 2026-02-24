import { useState, useEffect } from 'react';
import { useWMSLegend } from '../hooks/useWMSLegend';
import Icon from '@components/Icon';
import Loading from '@components/Loading';
import Tooltip from '@components/Tooltip';

const SymbologyItem = ({
    layer,
    isExpanded: initialExpanded = true,
    onToggle,
    prefix = null,
    simple = false,
    onClick = null
}) => {
    const { getLegendUrl, hasLegend } = useWMSLegend();
    const [internalExpanded, setInternalExpanded] = useState(initialExpanded);
    const [loadingSymbology, setLoadingSymbology] = useState(false);

    const handleInternalToggle = () => {
        setInternalExpanded(prev => !prev);
        if (onToggle) onToggle();
    };

    useEffect(() => {
        if (internalExpanded && layer && !simple) {
            setLoadingSymbology(true);

            const timer = setTimeout(() => {
                setLoadingSymbology(false);
            }, 300);

            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [internalExpanded, layer?.id, simple]);

    if (!layer) return null;

    const hasLayerLegend = hasLegend(layer);
    const legendUrl = hasLayerLegend ? getLegendUrl(layer) : null;

    const handleClick = (e) => {
        if (simple && onClick) {
            onClick(e);
        } else {
            handleInternalToggle();
        }
    };

    return (
        <>
            <button
                onClick={handleClick}
                className="w-full pl-2 pr-2 py-1.5 mb-3 flex items-center justify-between transition-colors text-left"
            >
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                    {prefix && (
                        <div onClick={(e) => e.stopPropagation()} className="shrink-0 flex items-center">
                            {prefix}
                        </div>
                    )}
                    <Tooltip content={layer.label} placement="top" delay={500}>
                        <div className="font-garet font-bold text-[11px]/[14px] tracking-normal truncate">
                            {layer.label}
                        </div>
                    </Tooltip>
                    <Loading visible={!simple && loadingSymbology} size="h-4 w-4" border="border-2" />
                </div>
                <Icon name={internalExpanded ? 'upArrow' : 'downArrow'} className="size-4" visible={!simple} />
            </button>

            {internalExpanded && (
                <div className="px-2 pb-2">
                    {loadingSymbology && (
                        <div className="flex items-center justify-center py-2">
                            <Loading visible={true} size="h-4 w-4" border="border-2" />
                            <span className="ml-2 text-xs text-gray-600 ">
                                Cargando...
                            </span>
                        </div>
                    )}

                    {!loadingSymbology && hasLayerLegend && legendUrl && (
                        <div>
                            <img
                                src={legendUrl}
                                alt={`Leyenda de ${layer.label}`}
                                className="max-w-full h-auto"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                }}
                            />
                            <div style={{ display: 'none' }} className="font-garet font-medium text-[#EA4335] text-[13px]/[19px] p-2 text-center">
                                <span className="inline-flex items-center justify-center gap-1">
                                    <Icon name="alert" className="size-4" />
                                    Error cargando leyenda
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default SymbologyItem;
