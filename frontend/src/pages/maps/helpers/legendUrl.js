import { resolveTimeStyle } from './wmsConfig';

const DEFAULT_LEGEND_OPTIONS = {
    fontName: 'Garet Regular',
    fontSize: 10,
    fontStyle: 'normal',
    fontColor: '0x454545',
    labelMargin: 12,
    dpi: 100,
    forceLabels: 'on',
};

export const legendVersionParam = (legendVersion) => (legendVersion ? `&lv=${legendVersion}` : '');

export const buildLegendGraphicUrl = ({
    baseUrl,
    layerName,
    styles = '',
    timeStylePattern = null,
    dateValue = null,
    cqlFilter = null,
    iconWidth = 20,
    iconHeight = 20,
    transparent = false,
    rule = null,
    hideEmptyRules = false,
    legendVersion = null,
    options = {},
}) => {
    if (!baseUrl || !layerName) return null;

    const opts = { ...DEFAULT_LEGEND_OPTIONS, ...options };
    const legendOptions = [
        `fontName:${opts.fontName}`,
        `fontSize:${opts.fontSize}`,
        `fontStyle:${opts.fontStyle}`,
        'fontAntiAliasing:true',
        `fontColor:${opts.fontColor}`,
        `labelMargin:${opts.labelMargin}`,
        `dpi:${opts.dpi}`,
        `forceLabels:${opts.forceLabels}`,
    ];
    if (hideEmptyRules && cqlFilter) legendOptions.push('hideEmptyRules:true');

    let style = styles || '';
    if (timeStylePattern && dateValue) {
        const resolved = resolveTimeStyle(timeStylePattern, dateValue);
        if (resolved) style = resolved;
    }

    return `${baseUrl}?service=WMS&version=1.1.0&request=GetLegendGraphic`
        + `&layer=${layerName}&format=image/png`
        + `&width=${iconWidth}&height=${iconHeight}`
        + (transparent ? '&transparent=true' : '')
        + (rule ? `&rule=${encodeURIComponent(rule)}` : '')
        + `&LEGEND_OPTIONS=${legendOptions.join(';')}`
        + (style ? `&STYLE=${style}` : '')
        + (cqlFilter ? `&CQL_FILTER=${encodeURIComponent(cqlFilter)}` : '')
        + legendVersionParam(legendVersion);
};
