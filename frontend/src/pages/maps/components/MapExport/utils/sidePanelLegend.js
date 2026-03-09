export const createSidePanelLegend = (selectedLegend, getLegendUrl, sectionPadding, sectionMargin, sectionRadius) => {
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
        overflow: 'auto',
        display: 'flex',
        alignItems: 'flex-start'
    });

    const legendUrl = getLegendUrl(selectedLegend, {
        dpi: 300,
        iconWidth: 20,
        iconHeight: 20,
        transparent: true,
        fontName: 'Garet Regular',
        fontSize: 12,
        fontStyle: 'normal',
        fontColor: '0x454545',
        labelMargin: 12,
        forceLabels: 'on'
    });
    if (legendUrl) {
        const legendImg = document.createElement('img');
        legendImg.src = legendUrl;
        Object.assign(legendImg.style, {
            maxWidth: '100%',
            height: 'auto',
            display: 'block'
        });
        legendsContainer.appendChild(legendImg);
    }

    return legendsContainer;
};
