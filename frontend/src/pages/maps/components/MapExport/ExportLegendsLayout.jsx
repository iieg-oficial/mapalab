const createExportLegendsLayout = (layers, getLegendUrl) => {
    const container = document.createElement('div');
    Object.assign(container.style, {
        position: 'absolute',
        left: '-9999px',
        width: '1300px',
        backgroundColor: '#ffffff',
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    });

    const title = document.createElement('h1');
    title.textContent = 'Simbología';
    Object.assign(title.style, {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '20px',
        borderBottom: '2px solid #eee',
        paddingBottom: '10px'
    });
    container.appendChild(title);

    const grid = document.createElement('div');
    Object.assign(grid.style, {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '20px',
        alignItems: 'start'
    });

    layers.forEach(layer => {
        const legendUrl = getLegendUrl({ id: layer.id, label: layer.label });
        if (legendUrl) {
            const item = document.createElement('div');
            Object.assign(item.style, {
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                breakInside: 'avoid'
            });

            const layerTitle = document.createElement('h3');
            layerTitle.textContent = layer.label || layer.name;
            Object.assign(layerTitle.style, {
                fontSize: '16px',
                fontWeight: '600',
                color: '#444',
                margin: '0'
            });

            const img = document.createElement('img');
            img.src = legendUrl;
            Object.assign(img.style, {
                maxWidth: '100%',
                height: 'auto',
                border: '1px solid #eee',
                padding: '5px',
                borderRadius: '4px'
            });

            item.appendChild(layerTitle);
            item.appendChild(img);
            grid.appendChild(item);
        }
    });

    container.appendChild(grid);
    return container;
};

export default createExportLegendsLayout;
