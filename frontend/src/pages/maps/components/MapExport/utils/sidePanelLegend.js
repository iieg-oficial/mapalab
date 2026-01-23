export const createSidePanelLegend = (selectedLegend, getLegendUrl, legendData, sectionPadding, sectionMargin, sectionRadius) => {
    if (!selectedLegend) {
        const spacer = document.createElement('div');
        spacer.style.flex = '1';
        return spacer;
    }

    const legendsContainer = document.createElement('div');
    Object.assign(legendsContainer.style, {
        padding: sectionPadding,
        margin: sectionMargin,
        backgroundColor: '#F7F8FC',
        borderRadius: sectionRadius,
        flex: '1',
        overflow: 'auto'
    });

    const legendSection = document.createElement('div');

    if (legendData && legendData.Legend && legendData.Legend[0] && legendData.Legend[0].rules) {
        const legendTitle = legendData.Legend[0].title;
        if (legendTitle) {
            const titleDiv = document.createElement('div');
            titleDiv.textContent = legendTitle;
            Object.assign(titleDiv.style, {
                font: 'normal normal bold 20px/24px Garet',
                color: '#2E4372',
                marginBottom: '12px',
                letterSpacing: '0px'
            });
            legendSection.appendChild(titleDiv);
        }

        const rules = legendData.Legend[0].rules;
        rules.forEach(rule => {
            const item = document.createElement('div');
            Object.assign(item.style, {
                display: 'flex',
                alignItems: 'center',
                fontSize: '12px',
                color: '#454545',
                fontFamily: 'Garet',
                fontWeight: '500',
                letterSpacing: '0px'
            });

            const symbol = document.createElement('div');
            Object.assign(symbol.style, {
                width: '40px',
                height: '20px',
                marginRight: '12px',
                flexShrink: '0'
            });

            const symbolizer = rule.symbolizers && rule.symbolizers[0];
            if (symbolizer) {
                const getColor = (c) => {
                    if (!c) return null;
                    if (typeof c === 'string') return c.startsWith('#') ? c : `#${c}`;
                    return null;
                };

                const extractColor = (obj, ...keys) => {
                    for (const key of keys) {
                        if (obj && obj[key]) return getColor(obj[key]);
                    }
                    return null;
                };

                if (symbolizer.Polygon) {
                    const fill = extractColor(symbolizer.Polygon, 'fill', 'Fill');
                    if (fill) symbol.style.backgroundColor = fill;
                    const stroke = extractColor(symbolizer.Polygon, 'stroke', 'Stroke');
                    if (stroke) symbol.style.borderColor = stroke;
                    symbol.style.marginTop = '12px';
                }
                else if (symbolizer.Point) {
                    const graphics = symbolizer.Point.graphics || symbolizer.Point.graphic || symbolizer.Point.Graphic;
                    const graphicItem = Array.isArray(graphics) ? graphics[0] : graphics;

                    if (graphicItem) {
                        const fill = extractColor(graphicItem, 'fill', 'Fill', 'fill-color');
                        if (fill) symbol.style.backgroundColor = fill;
                        const stroke = extractColor(graphicItem, 'stroke', 'Stroke', 'stroke-color');
                        if (stroke) symbol.style.borderColor = stroke;

                        const markValue = graphicItem.mark || graphicItem.Mark;
                        if (typeof markValue === 'string' && markValue === 'circle') {
                            symbol.style.borderRadius = '50%';
                            symbol.style.width = '15px';
                            symbol.style.height = '15px';
                            symbol.style.marginTop = '12px';
                        } else if (typeof markValue === 'object' && markValue) {
                            const wellKnownName = markValue.wellKnownName || markValue.WellKnownName || markValue['well-known-name'];
                            if (wellKnownName === 'circle') {
                                symbol.style.borderRadius = '50%';
                                symbol.style.width = '15px';
                                symbol.style.height = '15px';
                                symbol.style.marginTop = '12px';
                            }
                            const markFill = extractColor(markValue, 'fill', 'Fill', 'fill-color');
                            if (markFill) symbol.style.backgroundColor = markFill;
                            const markStroke = extractColor(markValue, 'stroke', 'Stroke', 'stroke-color');
                            if (markStroke) symbol.style.borderColor = markStroke;
                        }
                    }
                }
                else if (symbolizer.Line) {
                    symbol.style.height = '4px';
                    symbol.style.border = 'none';
                    const stroke = extractColor(symbolizer.Line, 'stroke', 'Stroke', 'stroke-color');
                    if (stroke) symbol.style.backgroundColor = stroke;
                    symbol.style.marginTop = '12px';
                }
            }

            item.appendChild(symbol);

            const label = document.createElement('span');
            label.textContent = rule.title || rule.name || 'Sin etiqueta';
            label.style.lineHeight = '1';
            item.appendChild(label);

            legendSection.appendChild(item);
        });
    } else if (getLegendUrl) {
        const legendUrl = getLegendUrl(selectedLegend);
        if (legendUrl) {
            const legendImg = document.createElement('img');
            legendImg.src = legendUrl;
            Object.assign(legendImg.style, {
                width: '100%',
                height: 'auto',
                objectFit: 'contain'
            });
            legendSection.appendChild(legendImg);
        }
    }

    legendsContainer.appendChild(legendSection);
    return legendsContainer;
};
