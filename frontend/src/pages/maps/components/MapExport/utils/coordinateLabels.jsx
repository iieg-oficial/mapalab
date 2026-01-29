import { latLonToUTM, formatUTMCoordinate } from './utmConversion';
import { EXPORT_DIMENSIONS } from './exportDimensions';

const {
    NUM_DIVISIONS_X,
    NUM_DIVISIONS_Y,
    LABEL_MARGIN_X,
    LABEL_MARGIN_Y,
    FRAME_COLOR
} = EXPORT_DIMENSIONS;

const createLabel = (text, isVertical = false) => {
    const label = document.createElement('div');
    label.textContent = text;
    Object.assign(label.style, {
        fontFamily: 'Garet, system-ui, sans-serif',
        fontSize: '11px',
        color: FRAME_COLOR,
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    });
    if (isVertical) {
        Object.assign(label.style, {
            transform: 'rotate(-90deg)',
            transformOrigin: 'center center'
        });
    }
    return label;
};

const coordinateLabels = (mapAreaWidth, mapAreaHeight, extent = null) => {
    const topLabelsContainer = document.createElement('div');
    Object.assign(topLabelsContainer.style, {
        width: `${mapAreaWidth}px`,
        height: `${LABEL_MARGIN_X}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box'
    });

    const bottomLabelsContainer = document.createElement('div');
    Object.assign(bottomLabelsContainer.style, {
        width: `${mapAreaWidth}px`,
        height: `${LABEL_MARGIN_X}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box'
    });

    const leftLabelsContainer = document.createElement('div');
    Object.assign(leftLabelsContainer.style, {
        width: `${LABEL_MARGIN_Y}px`,
        height: `${mapAreaHeight}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box'
    });

    const rightLabelsContainer = document.createElement('div');
    Object.assign(rightLabelsContainer.style, {
        width: `${LABEL_MARGIN_Y}px`,
        height: `${mapAreaHeight}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box'
    });

    if (extent) {
        const [minLon, minLat, maxLon, maxLat] = extent;
        const minUTM = latLonToUTM(minLat, minLon);
        const maxUTM = latLonToUTM(maxLat, maxLon);

        const eastingRange = maxUTM.easting - minUTM.easting;
        const northingRange = maxUTM.northing - minUTM.northing;

        for (let i = 0; i <= NUM_DIVISIONS_X; i++) {
            const easting = minUTM.easting + (i / NUM_DIVISIONS_X) * eastingRange;
            const text = formatUTMCoordinate(easting);
            topLabelsContainer.appendChild(createLabel(text, false));
            bottomLabelsContainer.appendChild(createLabel(text, false));
        }

        for (let i = 0; i <= NUM_DIVISIONS_Y; i++) {
            const northing = maxUTM.northing - (i / NUM_DIVISIONS_Y) * northingRange;
            const text = formatUTMCoordinate(northing);
            leftLabelsContainer.appendChild(createLabel(text, true));
            rightLabelsContainer.appendChild(createLabel(text, true));
        }
    }

    return {
        top: topLabelsContainer,
        bottom: bottomLabelsContainer,
        left: leftLabelsContainer,
        right: rightLabelsContainer
    };
};

export default coordinateLabels;
