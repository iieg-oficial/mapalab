import { latLonToUTM, formatUTMCoordinate } from './utmConversion';
import { EXPORT_DIMENSIONS } from './exportDimensions';

const {
    NUM_DIVISIONS_X,
    NUM_DIVISIONS_Y,
    FRAME_COLOR,
    LABEL_MARGIN_X,
    LABEL_MARGIN_Y
} = EXPORT_DIMENSIONS;

const createHorizontalLabel = (text, fraction) => {
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
        position: 'absolute',
        left: `${fraction * 100}%`,
        top: '0',
        height: '100%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    });

    const label = document.createElement('div');
    label.textContent = text;
    Object.assign(label.style, {
        fontFamily: 'Garet, system-ui, sans-serif',
        fontSize: '16px',
        color: FRAME_COLOR,
        whiteSpace: 'nowrap'
    });

    wrapper.appendChild(label);
    return wrapper;
};

const createVerticalLabel = (text, fraction) => {
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
        position: 'absolute',
        top: `${fraction * 100}%`,
        left: '0',
        width: '100%',
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    });

    const label = document.createElement('div');
    label.textContent = text;
    Object.assign(label.style, {
        fontFamily: 'Garet, system-ui, sans-serif',
        fontSize: '16px',
        color: FRAME_COLOR,
        whiteSpace: 'nowrap',
        transform: 'rotate(-90deg)'
    });

    wrapper.appendChild(label);
    return wrapper;
};

const coordinateLabels = (mapAreaWidth, mapAreaHeight, extent = null) => {
    const topLabelsContainer = document.createElement('div');
    Object.assign(topLabelsContainer.style, {
        position: 'relative',
        width: `${mapAreaWidth}px`,
        height: `${LABEL_MARGIN_X}px`,
        boxSizing: 'border-box'
    });

    const bottomLabelsContainer = document.createElement('div');
    Object.assign(bottomLabelsContainer.style, {
        position: 'relative',
        width: `${mapAreaWidth}px`,
        height: `${LABEL_MARGIN_X}px`,
        boxSizing: 'border-box'
    });

    const leftLabelsContainer = document.createElement('div');
    Object.assign(leftLabelsContainer.style, {
        position: 'relative',
        width: `${LABEL_MARGIN_Y}px`,
        height: `${mapAreaHeight}px`,
        boxSizing: 'border-box'
    });

    const rightLabelsContainer = document.createElement('div');
    Object.assign(rightLabelsContainer.style, {
        position: 'relative',
        width: `${LABEL_MARGIN_Y}px`,
        height: `${mapAreaHeight}px`,
        boxSizing: 'border-box'
    });

    if (extent) {
        const [minLon, minLat, maxLon, maxLat] = extent;
        const minUTM = latLonToUTM(minLat, minLon);
        const maxUTM = latLonToUTM(maxLat, maxLon);

        const eastingRange = maxUTM.easting - minUTM.easting;
        const northingRange = maxUTM.northing - minUTM.northing;

        for (let i = 1; i < NUM_DIVISIONS_X; i++) {
            const easting = minUTM.easting + (i / NUM_DIVISIONS_X) * eastingRange;
            const text = formatUTMCoordinate(easting);
            const fraction = i / NUM_DIVISIONS_X;
            topLabelsContainer.appendChild(createHorizontalLabel(text, fraction));
            bottomLabelsContainer.appendChild(createHorizontalLabel(text, fraction));
        }

        for (let j = 1; j < NUM_DIVISIONS_Y; j++) {
            const northing = maxUTM.northing - (j / NUM_DIVISIONS_Y) * northingRange;
            const text = formatUTMCoordinate(northing);
            const fraction = j / NUM_DIVISIONS_Y;
            leftLabelsContainer.appendChild(createVerticalLabel(text, fraction));
            rightLabelsContainer.appendChild(createVerticalLabel(text, fraction));
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
