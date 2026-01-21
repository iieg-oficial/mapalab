import logoMapalab from '@assets/logos/mapalab_large_dark.svg';
import logoIieg from '@assets/logos/iieg_large.svg';
import { JALISCO_BOUNDS } from '../../helpers/wmsConfig';

const createExportSidePanel = (options = {}) => {
    const {
        title,
        captureDate = new Date(),
        selectedLegend = null,
        getLegendUrl,
        legendData = null,
        viewType = 'viewport',
        viewportExtent = null,
        minimapImageUrl = null,
        source = 'Por definir'
    } = options;

    const panelWidth = 516;
    const SECTION_PADDING = '16px 40px';
    const SECTION_MARGIN = '8px 16px';
    const SECTION_RADIUS = '12px';

    const panel = document.createElement('div');
    Object.assign(panel.style, {
        position: 'absolute',
        top: '0',
        right: '0',
        width: `${panelWidth}px`,
        height: '100%',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e5e5e5',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '11px',
        zIndex: '1000',
        boxSizing: 'border-box'
    });

    const header = document.createElement('div');
    Object.assign(header.style, {
        padding: '28px 0px',
        backgroundColor: '#5c2472',
        borderRadius: SECTION_RADIUS,
        margin: '16px 16px 8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    });

    const logoImg = document.createElement('img');
    logoImg.src = logoMapalab;
    Object.assign(logoImg.style, {
        width: '357px',
        height: '60px'
    });
    header.appendChild(logoImg);
    panel.appendChild(header);

    const labelSection = document.createElement('div');
    Object.assign(labelSection.style, {
        padding: SECTION_PADDING,
        margin: SECTION_MARGIN,
        backgroundColor: '#F7F8FC',
        borderRadius: SECTION_RADIUS,
    });

    const titleText = document.createElement('div');
    const dateLabel = document.createElement('div');

    titleText.textContent = title;
    dateLabel.textContent = '*Captura de pantalla tomada de mapa.iieg.gob.mx';

    Object.assign(titleText.style, {
        textAlign: 'left',
        font: 'normal normal bold 24px/24px Garet',
        letterSpacing: '0px',
        color: '#2E4372',
        marginBottom: '26px'
    });

    Object.assign(dateLabel.style, {
        textAlign: 'left',
        font: 'normal normal 500 12px/24px Garet',
        letterSpacing: '0px',
        color: '#2E4372'
    });

    labelSection.appendChild(titleText);
    labelSection.appendChild(dateLabel);
    panel.appendChild(labelSection);

    if (selectedLegend) {
        const legendsContainer = document.createElement('div');
        Object.assign(legendsContainer.style, {
            padding: SECTION_PADDING,
            margin: SECTION_MARGIN,
            backgroundColor: '#F7F8FC',
            borderRadius: SECTION_RADIUS,
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
                    marginBottom: '10px',
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
                    marginBottom: '8px',
                    fontSize: '12px',
                    color: '#555',
                    fontFamily: 'Garet'
                });

                const symbol = document.createElement('div');
                Object.assign(symbol.style, {
                    width: '16px',
                    height: '16px',
                    marginRight: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    flexShrink: '0'
                });

                const symbolizer = rule.symbolizers && rule.symbolizers[0];
                if (symbolizer) {
                    const getColor = (c) => c && !c.startsWith('#') ? `#${c}` : c;

                    if (symbolizer.Polygon) {
                        const fill = symbolizer.Polygon.fill;
                        if (fill) symbol.style.backgroundColor = getColor(fill);
                        const stroke = symbolizer.Polygon.stroke;
                        if (stroke) symbol.style.borderColor = getColor(stroke);
                    }
                    else if (symbolizer.Point) {
                        const graphic = symbolizer.Point.graphic;
                        if (graphic && graphic.mark) {
                            const fill = graphic.mark.fill;
                            if (fill) symbol.style.backgroundColor = getColor(fill);
                            const stroke = graphic.mark.stroke;
                            if (stroke) symbol.style.borderColor = getColor(stroke);

                            if (graphic.mark.wellKnownName === 'circle') symbol.style.borderRadius = '50%';
                        }
                    }
                    else if (symbolizer.Line) {
                        symbol.style.height = '4px';
                        symbol.style.border = 'none';
                        const stroke = symbolizer.Line.stroke;
                        if (stroke) symbol.style.backgroundColor = getColor(stroke);
                    }
                }

                item.appendChild(symbol);

                const label = document.createElement('span');
                label.textContent = rule.title || rule.name || 'Sin etiqueta';
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
        panel.appendChild(legendsContainer);
    } else {
        const spacer = document.createElement('div');
        spacer.style.flex = '1';
        panel.appendChild(spacer);
    }

    const minimapSection = document.createElement('div');

    Object.assign(minimapSection.style, {
        margin: SECTION_MARGIN,
    });

    const minimapContainer = document.createElement('div');

    Object.assign(minimapContainer.style, {
        position: 'relative',
        width: '100%',
        borderRadius: SECTION_RADIUS,
        overflow: 'hidden',
    });

    if (minimapImageUrl) {
        const minimapImg = document.createElement('img');
        minimapImg.src = minimapImageUrl;
        Object.assign(minimapImg.style, {
            width: '516px',
            height: '430px',
            objectFit: 'cover'
        });
        minimapContainer.appendChild(minimapImg);

        if (viewType === 'viewport' && viewportExtent) {
            const [minLon, minLat, maxLon, maxLat] = JALISCO_BOUNDS.coords;
            const [vpMinLon, vpMinLat, vpMaxLon, vpMaxLat] = viewportExtent;

            const scaleX = 100 / (maxLon - minLon);
            const scaleY = 100 / (maxLat - minLat);

            const rectX = (vpMinLon - minLon) * scaleX;
            const rectY = 100 - (vpMaxLat - minLat) * scaleY;
            const rectW = (vpMaxLon - vpMinLon) * scaleX;
            const rectH = (vpMaxLat - vpMinLat) * scaleY;

            const viewportRect = document.createElement('div');
            Object.assign(viewportRect.style, {
                position: 'absolute',
                left: `${Math.max(0, Math.min(100 - rectW, rectX))}%`,
                top: `${Math.max(0, Math.min(100 - rectH, rectY))}%`,
                width: `${Math.min(100, rectW)}%`,
                height: `${Math.min(100, rectH)}%`,
                border: '4px solid rgba(255, 131, 0, 1)',
                boxSizing: 'border-box'
            });
            minimapContainer.appendChild(viewportRect);
        }
    } else {
        const placeholder = document.createElement('div');
        placeholder.textContent = 'Miniatura';
        Object.assign(placeholder.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#999',
            fontSize: '10px'
        });
        minimapContainer.appendChild(placeholder);
    }

    minimapSection.appendChild(minimapContainer);
    panel.appendChild(minimapSection);

    const footer = document.createElement('div');
    Object.assign(footer.style, {
        padding: SECTION_PADDING,
        margin: '8px 16px 16px 16px',
        borderTop: '1px solid #e5e5e5',
        backgroundColor: '#fafafa',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    });

    const infoSection = document.createElement('div');
    Object.assign(infoSection.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flex: '1'
    });

    const formattedDate = captureDate.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = captureDate.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
    });
    const formattedDateTime = `${formattedDate}, ${formattedTime} hrs`;

    const footerItems = [
        { label: 'Fecha de captura:', value: formattedDateTime },
        { label: 'Proyección:', value: 'EPSG:6368 - México ITRF 2008/UTM Zone 13N' },
        { label: 'Fuente:', value: source }
    ];

    footerItems.forEach(item => {
        const row = document.createElement('div');
        Object.assign(row.style, {
            display: 'flex',
            alignItems: 'baseline',
            fontSize: '9px',
            lineHeight: '1.2'
        });

        const label = document.createElement('span');
        label.textContent = item.label;
        Object.assign(label.style, {
            color: '#2E4372', // Azul corporativo para etiquetas
            fontWeight: 'bold',
            marginRight: '6px',
            minWidth: '85px'
        });

        const value = document.createElement('span');
        value.textContent = item.value;
        Object.assign(value.style, {
            color: '#555',
            flex: '1'
        });

        row.appendChild(label);
        row.appendChild(value);
        infoSection.appendChild(row);
    });

    const logoSection = document.createElement('div');
    Object.assign(logoSection.style, {
        marginLeft: '20px',
        display: 'flex',
        alignItems: 'center'
    });

    const iiegLogo = document.createElement('img');
    iiegLogo.src = logoIieg;
    Object.assign(iiegLogo.style, {
        width: '120px',
        height: 'auto'
    });

    logoSection.appendChild(iiegLogo);

    footer.appendChild(infoSection);
    footer.appendChild(logoSection);
    panel.appendChild(footer);

    return panel;
};

export default createExportSidePanel;
