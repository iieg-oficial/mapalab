const createExportLegendsLayout = (layers, getLegendUrl, containerWidthPx, containerHeightPx) => {
    const validLayers = layers.filter(layer => getLegendUrl({ id: layer.id, label: layer.label }));
    const count = validLayers.length;
    const columns = Math.max(1, Math.ceil(Math.sqrt(count)));

    const container = document.createElement('div');
    Object.assign(container.style, {
        position: 'absolute',
        left: '-9999px',
        width: `${containerWidthPx}px`,
        height: `${containerHeightPx}px`,
        backgroundColor: '#F9FBFF',
        padding: '20px 18px 24px 18px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontFamily: 'Garet, Helvetica, sans-serif',
        overflow: 'hidden'
    });

    const header = document.createElement('div');
    Object.assign(header.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: '0',
        marginBottom: '4px'
    });

    const title = document.createElement('h3');
    title.textContent = 'Leyendas';
    Object.assign(title.style, {
        fontFamily: 'Garet, Helvetica, sans-serif',
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#1A2664',
        margin: '0'
    });
    header.appendChild(title);
    container.appendChild(header);

    const grid = document.createElement('div');
    Object.assign(grid.style, {
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, auto)`,
        justifyContent: 'start',
        gap: '16px',
        alignItems: 'start',
        flex: '1',
        overflow: 'hidden'
    });

    validLayers.forEach(layer => {
        const legendUrl = getLegendUrl({ id: layer.id, label: layer.label }, {
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

        const card = document.createElement('div');
        Object.assign(card.style, {
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            breakInside: 'avoid'
        });

        const layerTitle = document.createElement('div');
        layerTitle.textContent = layer.label || layer.name;
        Object.assign(layerTitle.style, {
            fontFamily: 'Garet, Helvetica, sans-serif',
            fontSize: '12px',
            fontWeight: 'bold',
            lineHeight: '16px',
            letterSpacing: '0px',
            color: '#1A2664',
            margin: '0 0 2px 0'
        });

        const imgWrapper = document.createElement('div');
        Object.assign(imgWrapper.style, {
            paddingTop: '12px'
        });

        const img = document.createElement('img');
        img.src = legendUrl;
        Object.assign(img.style, {
            width: 'auto',
            height: 'auto',
            maxWidth: '100%',
            display: 'block'
        });

        imgWrapper.appendChild(img);
        card.appendChild(layerTitle);
        card.appendChild(imgWrapper);
        grid.appendChild(card);
    });

    container.appendChild(grid);
    return container;
};

export default createExportLegendsLayout;
