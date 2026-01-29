import logoIieg from '@assets/logos/iieg_large.svg';

export const createSidePanelFooter = (captureDate, source, contentWidth, marginRight, sectionPadding, sectionRadius) => {
    const footer = document.createElement('div');
    Object.assign(footer.style, {
        width: `${contentWidth}px`,
        height: 'auto',
        borderRadius: sectionRadius,
        padding: sectionPadding,
        margin: `8px ${marginRight}px 0 0`,
        backgroundColor: '#F7F8FC',
    });

    const infoSection = document.createElement('div');
    Object.assign(infoSection.style, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'start',
        gap: '10px',
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
        { label: 'Sistema de referencia de coordenadas:', value: 'EPSG:6368 - México ITRF 2008/UTM Zone 13N' },
        { label: 'Fuente:', value: source }
    ];

    footerItems.forEach(item => {
        const row = document.createElement('div');
        Object.assign(row.style, {
            display: 'flex',
            alignItems: 'baseline',
        });

        const label = document.createElement('span');
        label.textContent = item.label;
        Object.assign(label.style, {
            color: '#2E4372',
            font: '12px/24px Garet, system-ui, sans-serif',
            fontWeight: 'bold',
            marginRight: '12px',
            letterSpacing: '0'
        });

        const value = document.createElement('span');
        value.textContent = item.value;
        Object.assign(value.style, {
            font: '12px/24px Garet, system-ui, sans-serif',
            color: '#2E4372',
            fontWeight: 'normal',
            letterSpacing: '0',
            flex: '1'
        });

        row.appendChild(label);
        row.appendChild(value);
        infoSection.appendChild(row);
    });

    footer.appendChild(infoSection);
    return footer;
};

export const createSidePanelLogo = (marginRight, sectionPadding) => {
    const logoSection = document.createElement('div');
    Object.assign(logoSection.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 'auto',
        padding: sectionPadding,
        margin: `0px ${marginRight}px ${marginRight}px 0`,
    });

    const iiegLogo = document.createElement('img');
    iiegLogo.src = logoIieg;
    Object.assign(iiegLogo.style, {
        width: '319px',
        height: '98px'
    });

    logoSection.appendChild(iiegLogo);
    return logoSection;
};
