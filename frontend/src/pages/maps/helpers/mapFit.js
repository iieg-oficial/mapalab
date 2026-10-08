export const ACTIVE_LAYERS_PANEL_WIDTH = 373;

export const VIEWPORT_EDGE = 16;
export const PANEL_GAP = 14;
const TOP_MARGIN = 50;
const BOTTOM_MARGIN = 30;
const MOBILE_MARGIN = 28;
const MOBILE_X_MARGIN = 40;

export const getFitPadding = ({ mapSize, siderWidth = 0, rightPanelWidth = 0, isMobile = false } = {}) => {
    const [w, h] = Array.isArray(mapSize) && mapSize.length === 2 ? mapSize : [0, 0];

    let top, right, bottom, left;
    if (isMobile) {
        top = MOBILE_MARGIN;
        right = MOBILE_X_MARGIN;
        bottom = MOBILE_MARGIN;
        left = MOBILE_X_MARGIN;
    } else {
        top = TOP_MARGIN;
        bottom = BOTTOM_MARGIN;
        left = VIEWPORT_EDGE + siderWidth + PANEL_GAP;
        right = VIEWPORT_EDGE + rightPanelWidth + PANEL_GAP;
    }

    if (w > 0 && left + right > w * 0.8) {
        const scale = (w * 0.8) / (left + right);
        left = Math.round(left * scale);
        right = Math.round(right * scale);
    }
    if (h > 0 && top + bottom > h * 0.8) {
        const scale = (h * 0.8) / (top + bottom);
        top = Math.round(top * scale);
        bottom = Math.round(bottom * scale);
    }

    return [top, right, bottom, left];
};
