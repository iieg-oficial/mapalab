import logoMapalab from '@assets/logos/mapalab_large.svg';
import logoIieg from '@assets/logos/iieg_large.svg';
import { JALISCO_BOUNDS } from '../../helpers/wmsConfig';

const createExportSidePanel = (options = {}) => {
    const {
        title = 'Título del mapa',
        captureDate = new Date(),
        selectedLegend = null,
        getLegendUrl,
        viewType = 'viewport',
        viewportExtent = null,
        minimapImageUrl = null,
        source = 'Por definir'
    } = options;

    const panelWidth = 516;

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
        padding: '16px',
        backgroundColor: '#5c2472',
        borderRadius: '0 0 12px 12px'
    });

    const logoImg = document.createElement('img');
    logoImg.src = logoMapalab;
    Object.assign(logoImg.style, {
        width: '160px',
        height: 'auto'
    });
    header.appendChild(logoImg);
    panel.appendChild(header);

    const dateSection = document.createElement('div');
    Object.assign(dateSection.style, {
        padding: '12px 16px',
        borderBottom: '1px solid #e5e5e5',
        color: '#666'
    });

    const dateLabel = document.createElement('div');
    dateLabel.textContent = 'Fecha y hora de captura:';
    Object.assign(dateLabel.style, {
        fontSize: '9px',
        color: '#999',
        marginBottom: '4px'
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

    const dateValue = document.createElement('div');
    dateValue.textContent = formattedDateTime;
    Object.assign(dateValue.style, {
        fontSize: '10px',
        fontWeight: '500'
    });

    dateSection.appendChild(dateLabel);
    dateSection.appendChild(dateValue);
    panel.appendChild(dateSection);

    const titleSection = document.createElement('div');
    Object.assign(titleSection.style, {
        padding: '12px 16px',
        borderBottom: '1px solid #e5e5e5'
    });

    const titleText = document.createElement('div');
    titleText.textContent = title;
    Object.assign(titleText.style, {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#333'
    });
    titleSection.appendChild(titleText);
    panel.appendChild(titleSection);

    if (selectedLegend && getLegendUrl) {
        const legendsContainer = document.createElement('div');
        Object.assign(legendsContainer.style, {
            flex: '1',
            overflowY: 'auto',
            padding: '12px 16px'
        });

        const legendSection = document.createElement('div');

        const legendTitle = document.createElement('div');
        legendTitle.textContent = 'Simbología';
        Object.assign(legendTitle.style, {
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '8px',
            paddingBottom: '4px',
            borderBottom: '1px solid #e5e5e5'
        });
        legendSection.appendChild(legendTitle);

        const legendUrl = getLegendUrl(selectedLegend);
        if (legendUrl) {
            const legendImg = document.createElement('img');
            legendImg.src = legendUrl;
            Object.assign(legendImg.style, {
                width: '100%',
                height: 'auto',
                maxHeight: '200px',
                objectFit: 'contain'
            });
            legendSection.appendChild(legendImg);
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
        padding: '16px 23px',
    });

    const minimapContainer = document.createElement('div');

    Object.assign(minimapContainer.style, {
        position: 'relative',
        width: '100%',
        borderRadius: '12px',
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
                border: '1px solid rgba(255, 131, 0, 0.6)',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
        padding: '12px 16px',
        borderTop: '1px solid #e5e5e5',
        backgroundColor: '#fafafa'
    });

    const footerItems = [
        { label: 'Fecha de captura:', value: formattedDateTime },
        { label: 'Proyección:', value: 'EPSG:6368 - México ITRF 2008/UTM Zone 13N' },
        { label: 'Fuente:', value: source }
    ];

    footerItems.forEach(item => {
        const footerRow = document.createElement('div');
        Object.assign(footerRow.style, {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
            fontSize: '8px'
        });

        const label = document.createElement('span');
        label.textContent = item.label;
        Object.assign(label.style, {
            color: '#999'
        });

        const value = document.createElement('span');
        value.textContent = item.value;
        Object.assign(value.style, {
            color: '#555',
            textAlign: 'right',
            maxWidth: '60%'
        });

        footerRow.appendChild(label);
        footerRow.appendChild(value);
        footer.appendChild(footerRow);
    });

    panel.appendChild(footer);

    const iiegSection = document.createElement('div');
    Object.assign(iiegSection.style, {
        padding: '12px 16px',
        borderTop: '1px solid #e5e5e5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    });

    const iiegLogo = document.createElement('img');
    iiegLogo.src = logoIieg;
    Object.assign(iiegLogo.style, {
        width: '100px',
        height: 'auto'
    });
    iiegSection.appendChild(iiegLogo);
    panel.appendChild(iiegSection);

    return panel;
};

export default createExportSidePanel;
