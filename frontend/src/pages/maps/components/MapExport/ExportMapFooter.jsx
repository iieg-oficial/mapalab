const createExportMapFooter = (layers, getLegendUrl, filterDates) => {
    const layersToShow = layers.slice(0, 3);

    const footer = document.createElement('div');
    Object.assign(footer.style, {
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        padding: '20px',
        fontSize: '12px',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'flex-start',
        zIndex: '1000'
    });

    const footerLeft = document.createElement('div');
    Object.assign(footerLeft.style, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '10px 10px',
        borderRadius: '8px',
        minWidth: '280px',
        maxWidth: '40%',
        border: '1px solid #000000ff',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.3)'
    });

    const titleHeader = document.createElement('h2');
    titleHeader.textContent = 'Simbología';
    Object.assign(titleHeader.style, {
        fontWeight: 'bold',
        color: '#333',
        fontSize: '20px',
        textAlign: 'center',
        margin: '0 0 8px 0',
        width: '100%'
    });

    const symbolsContent = document.createElement('div');
    Object.assign(symbolsContent.style, {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    });

    layersToShow.forEach(layer => {
        const legendUrl = getLegendUrl({ id: layer.id, label: layer.label });
        if (legendUrl) {
            const legendContainer = document.createElement('div');
            Object.assign(legendContainer.style, {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: '1',
                minWidth: '100px'
            });

            const layerTitle = document.createElement('span');
            layerTitle.textContent = layer.name || layer.label;
            Object.assign(layerTitle.style, {
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '4px',
                textAlign: 'center'
            });

            const symbologyImage = document.createElement('img');
            symbologyImage.src = legendUrl;
            Object.assign(symbologyImage.style, {
                maxWidth: '100%',
                height: 'auto',
                maxHeight: '150px',
                zIndex: '1000'
            });

            legendContainer.appendChild(layerTitle);
            legendContainer.appendChild(symbologyImage);
            symbolsContent.appendChild(legendContainer);
        }
    });

    footerLeft.appendChild(titleHeader);
    footerLeft.appendChild(symbolsContent);

    if (filterDates) {
        const dateContainer = document.createElement('div');
        Object.assign(dateContainer.style, {
            marginTop: '10px',
            borderTop: '1px solid #eee',
            paddingTop: '5px',
            width: '100%',
            textAlign: 'center'
        });

        const dateText = document.createElement('span');
        dateText.textContent = `Filtro: ${filterDates}`;
        Object.assign(dateText.style, {
            fontSize: '11px',
            color: '#555',
            fontWeight: '500'
        });

        dateContainer.appendChild(dateText);
        footerLeft.appendChild(dateContainer);
    }

    footer.appendChild(footerLeft);
    return footer;
};

export default createExportMapFooter;
