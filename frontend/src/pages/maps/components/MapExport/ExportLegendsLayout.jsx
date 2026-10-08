const buildHexbinSwatches = (entries) => {
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
        paddingTop: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    });

    entries.forEach(entry => {
        const row = document.createElement('div');
        Object.assign(row.style, { display: 'flex', alignItems: 'center', gap: '8px' });

        const swatch = document.createElement('span');
        Object.assign(swatch.style, {
            width: '20px',
            height: '20px',
            borderRadius: '3px',
            backgroundColor: entry.color,
            display: 'block',
            flexShrink: '0'
        });

        const label = document.createElement('span');
        label.textContent = entry.from === entry.to
            ? String(entry.from)
            : `${entry.from} – ${entry.to}`;
        Object.assign(label.style, {
            fontFamily: 'Garet, Helvetica, sans-serif',
            fontSize: '12px',
            lineHeight: '16px',
            color: '#454545'
        });

        row.appendChild(swatch);
        row.appendChild(label);
        wrapper.appendChild(row);
    });

    return wrapper;
};

const createExportLegendsLayout = (layers, getLegendUrl, containerWidthPx, containerHeightPx, hexbinEntriesById = null) => {
    const hexbinOf = (layerId) => hexbinEntriesById?.get?.(layerId) || null;
    const validLayers = layers.filter(layer => hexbinOf(layer.id) || getLegendUrl({ id: layer.id, label: layer.label }));
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
        const hexbinEntries = hexbinOf(layer.id);
        const legendUrl = hexbinEntries ? null : getLegendUrl({ id: layer.id, label: layer.label }, {
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

        let body;
        if (hexbinEntries) {
            body = buildHexbinSwatches(hexbinEntries);
        } else {
            body = document.createElement('div');
            Object.assign(body.style, { paddingTop: '12px' });

            const img = document.createElement('img');
            img.src = legendUrl;
            Object.assign(img.style, {
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                display: 'block'
            });
            body.appendChild(img);
        }

        card.appendChild(layerTitle);
        card.appendChild(body);
        grid.appendChild(card);
    });

    container.appendChild(grid);
    return container;
};

export default createExportLegendsLayout;
