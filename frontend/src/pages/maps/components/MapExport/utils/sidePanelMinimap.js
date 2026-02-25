export const createSidePanelMinimap = (minimapImageUrl, viewType, viewportExtent, contentWidth, sectionMargin, sectionRadius, minimapBounds) => {
    const minimapSection = document.createElement('div');

    Object.assign(minimapSection.style, {
        margin: sectionMargin,
    });

    const minimapContainer = document.createElement('div');

    Object.assign(minimapContainer.style, {
        position: 'relative',
        width: '100%',
        borderRadius: sectionRadius,
        overflow: 'hidden',
    });

    if (minimapImageUrl) {
        const minimapImg = document.createElement('img');
        minimapImg.src = minimapImageUrl;
        Object.assign(minimapImg.style, {
            width: `${contentWidth}px`,
            height: '430px',
            objectFit: 'cover'
        });
        minimapContainer.appendChild(minimapImg);

        if (viewType === 'viewport' && viewportExtent && minimapBounds) {
            const [minLon, minLat, maxLon, maxLat] = minimapBounds;
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
    return minimapSection;
};
