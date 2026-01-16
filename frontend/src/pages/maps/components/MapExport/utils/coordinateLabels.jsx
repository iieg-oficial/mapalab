const latLonToUTM = (lat, lon) => {
    const a = 6378137;
    const f = 1 / 298.257223563;
    const k0 = 0.9996;
    const e = Math.sqrt(2 * f - f * f);
    const e2 = e * e;
    const ep2 = e2 / (1 - e2);

    const zone = 13;
    const lon0 = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;

    const latRad = lat * Math.PI / 180;
    const lonRad = lon * Math.PI / 180;

    const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) * Math.sin(latRad));
    const T = Math.tan(latRad) * Math.tan(latRad);
    const C = ep2 * Math.cos(latRad) * Math.cos(latRad);
    const A = Math.cos(latRad) * (lonRad - lon0);

    const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * latRad
        - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * latRad)
        + (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * latRad)
        - (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * latRad));

    let easting = k0 * N * (A + (1 - T + C) * A * A * A / 6
        + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A * A * A * A * A / 120) + 500000;

    let northing = k0 * (M + N * Math.tan(latRad) * (A * A / 2
        + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24
        + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A * A * A * A * A * A / 720));

    if (lat < 0) {
        northing += 10000000;
    }

    return { easting: Math.round(easting), northing: Math.round(northing) };
};

const formatUTMCoordinate = (value) => {
    return `${(value / 1000).toFixed(0)} km`;
};

const coordinateLabels = (height, width, extent = null) => {
    const labelContainer = document.createElement('div');
    labelContainer.style.position = 'absolute';
    labelContainer.style.top = '0';
    labelContainer.style.left = '0';
    labelContainer.style.width = '100%';
    labelContainer.style.height = '100%';
    labelContainer.style.pointerEvents = 'none';
    labelContainer.style.fontSize = '9px';
    labelContainer.style.color = 'rgba(0, 0, 0, 0.7)';
    labelContainer.style.fontWeight = '500';
    labelContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    const numLabelsX = 5;
    const numLabelsY = 4;

    if (extent) {
        const [minLon, minLat, maxLon, maxLat] = extent;

        const minUTM = latLonToUTM(minLat, minLon);
        const maxUTM = latLonToUTM(maxLat, maxLon);

        const eastingRange = maxUTM.easting - minUTM.easting;
        const northingRange = maxUTM.northing - minUTM.northing;

        for (let i = 0; i <= numLabelsX; i++) {
            const xPercent = (i / numLabelsX) * 100;
            const easting = minUTM.easting + (i / numLabelsX) * eastingRange;

            const label = document.createElement('div');
            label.style.position = 'absolute';
            label.style.bottom = '8px';
            label.style.left = `${xPercent}%`;
            label.style.transform = 'translateX(-50%)';
            label.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
            label.style.padding = '2px 4px';
            label.style.borderRadius = '2px';
            label.textContent = formatUTMCoordinate(easting);
            labelContainer.appendChild(label);
        }

        for (let i = 0; i <= numLabelsY; i++) {
            const yPercent = (i / numLabelsY) * 100;
            const northing = maxUTM.northing - (i / numLabelsY) * northingRange;

            const label = document.createElement('div');
            label.style.position = 'absolute';
            label.style.left = '8px';
            label.style.top = `${yPercent}%`;
            label.style.transform = 'translateY(-50%)';
            label.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
            label.style.padding = '2px 4px';
            label.style.borderRadius = '2px';
            label.textContent = formatUTMCoordinate(northing);
            labelContainer.appendChild(label);
        }
    } else {
        for (let i = 0; i <= width; i += 150) {
            const label = document.createElement('div');
            label.style.position = 'absolute';
            label.style.bottom = '8px';
            label.style.left = `${i}px`;
            label.style.transform = 'translateX(-50%)';
            label.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
            label.style.padding = '2px 4px';
            label.style.borderRadius = '2px';
            label.textContent = `${i}`;
            labelContainer.appendChild(label);
        }

        for (let i = 0; i <= height; i += 100) {
            const label = document.createElement('div');
            label.style.position = 'absolute';
            label.style.left = '8px';
            label.style.top = `${i}px`;
            label.style.transform = 'translateY(-50%)';
            label.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
            label.style.padding = '2px 4px';
            label.style.borderRadius = '2px';
            label.textContent = `${i}`;
            labelContainer.appendChild(label);
        }
    }

    return labelContainer;
};

export default coordinateLabels;