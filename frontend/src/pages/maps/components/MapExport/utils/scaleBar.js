const scaleBar = (mapAreaWidth, extent) => {
    const outer = document.createElement('div');
    Object.assign(outer.style, {
        position: 'absolute',
        bottom: '30px',
        left: '30px',
        zIndex: '1000',
        display: 'inline-block'
    });

    if (!extent || !mapAreaWidth) return outer;

    const [minLon, minLat, maxLon, maxLat] = extent;
    const centerLat = (minLat + maxLat) / 2;
    const metersPerDegree = 111320 * Math.cos(centerLat * Math.PI / 180);
    const mapWidthMeters = (maxLon - minLon) * metersPerDegree;
    const metersPerPixel = mapWidthMeters / mapAreaWidth;

    const targetPixels = 445;
    const targetMeters = targetPixels * metersPerPixel;

    const magnitude = Math.pow(10, Math.floor(Math.log10(targetMeters)));
    const normalized = targetMeters / magnitude;
    let niceFactor;
    if (normalized < 1.5) niceFactor = 1;
    else if (normalized < 3.5) niceFactor = 2;
    else if (normalized < 7.5) niceFactor = 5;
    else niceFactor = 10;

    const distanceMeters = niceFactor * magnitude;
    const barPixels = Math.round(distanceMeters / metersPerPixel);

    const unit = distanceMeters >= 1000 ? 'km' : 'm';
    const fmt = (m) => m >= 1000 ? `${m / 1000}` : `${m}`;
    const halfVal = fmt(distanceMeters / 2);
    const fullVal = fmt(distanceMeters);

    const TICK_HEIGHT = 14;
    const STROKE = 4;
    const COLOR = '#111';
    const FONT = 'Garet, system-ui, sans-serif';

    const labelRow = document.createElement('div');
    Object.assign(labelRow.style, {
        position: 'relative',
        width: `${barPixels}px`,
        height: '21px',
        marginBottom: '12px'
    });

    const makeLabel = (text, leftPx, anchor) => {
        const el = document.createElement('div');
        el.textContent = text;
        Object.assign(el.style, {
            position: 'absolute',
            left: `${leftPx}px`,
            bottom: '0',
            transform: anchor,
            fontFamily: FONT,
            fontSize: '18px',
            fontWeight: '700',
            color: COLOR,
            whiteSpace: 'nowrap',
            textShadow: '-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff'
        });
        return el;
    };

    labelRow.appendChild(makeLabel('0', 0, 'none'));
    labelRow.appendChild(makeLabel(halfVal, barPixels / 2, 'translateX(-50%)'));
    labelRow.appendChild(makeLabel(`${fullVal} ${unit}`, barPixels, 'translateX(-50%)'));

    const barRow = document.createElement('div');
    Object.assign(barRow.style, { display: 'flex', width: `${barPixels}px` });

    const leftSeg = document.createElement('div');
    Object.assign(leftSeg.style, {
        flex: '1',
        height: `${TICK_HEIGHT}px`,
        borderTop: `${STROKE}px solid ${COLOR}`,
        borderLeft: `${STROKE}px solid ${COLOR}`,
        borderRight: `${STROKE}px solid ${COLOR}`,
        boxSizing: 'border-box'
    });

    const rightSeg = document.createElement('div');
    Object.assign(rightSeg.style, {
        flex: '1',
        height: `${TICK_HEIGHT}px`,
        borderBottom: `${STROKE}px solid ${COLOR}`,
        borderRight: `${STROKE}px solid ${COLOR}`,
        boxSizing: 'border-box'
    });

    barRow.appendChild(leftSeg);
    barRow.appendChild(rightSeg);

    outer.appendChild(labelRow);
    outer.appendChild(barRow);

    return outer;
};

export default scaleBar;
