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
        minute: '2-digit',
        hour12: true
    });

    const formattedDateTime = `${formattedDate}, ${formattedTime}`;

    const footerItems = [
        { label: 'Fecha y hora de captura:', value: formattedDateTime },
        { label: 'Proyección:', value: 'EPSG:6368 - México ITRF 2008/UTM Zone 13N' },
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
            fontWeight: '300',
            letterSpacing: '0',
            flex: '1'
        });

        row.appendChild(label);
        row.appendChild(value);
        infoSection.appendChild(row);
    });

    const disclaimer = document.createElement('div');
    disclaimer.textContent = 'Imagen generada con fines informativos a partir de datos del Instituto de Información Estadística y Geográfica del Estado de Jalisco (IIEG). Su utilización es responsabilidad de quien la genera.';
    Object.assign(disclaimer.style, {
        color: '#2E4372',
        textAlign: 'left',
        font: '10px/16px Garet, system-ui, sans-serif',
        fontWeight: '500',
        letterSpacing: '0px',
        marginTop: '8px'
    });
    infoSection.appendChild(disclaimer);

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
