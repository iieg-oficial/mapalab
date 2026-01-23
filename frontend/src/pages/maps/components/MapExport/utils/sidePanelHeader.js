import logoMapalab from '@assets/logos/mapalab_large_dark.svg';

export const createSidePanelHeader = (marginRight, sectionRadius) => {
    const header = document.createElement('div');
    Object.assign(header.style, {
        padding: '28px 0px',
        backgroundColor: '#5c2472',
        borderRadius: sectionRadius,
        margin: `${marginRight}px ${marginRight}px 8px 0`,
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

    return header;
};

export const createSidePanelTitle = (title, contentWidth, sectionMargin, sectionRadius) => {
    const labelSection = document.createElement('div');
    Object.assign(labelSection.style, {
        width: `${contentWidth}px`,
        height: '139px',
        padding: '0 40px 30px 40px',
        margin: sectionMargin,
        backgroundColor: '#F7F8FC',
        borderRadius: sectionRadius,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    });

    const titleText = document.createElement('div');
    const dateLabel = document.createElement('div');

    titleText.textContent = title;
    dateLabel.textContent = '*Captura de pantalla tomada de mapalab.iieg.gob.mx';

    Object.assign(titleText.style, {
        textAlign: 'left',
        font: 'normal normal bold 24px Garet',
        letterSpacing: '0px',
        color: '#2E4372',
    });

    Object.assign(dateLabel.style, {
        textAlign: 'left',
        font: 'normal normal 500 12px/24px Garet',
        letterSpacing: '0px',
        color: '#2E4372'
    });

    labelSection.appendChild(titleText);
    labelSection.appendChild(dateLabel);

    return labelSection;
};
