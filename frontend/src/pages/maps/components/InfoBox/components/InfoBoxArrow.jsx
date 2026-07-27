import { useEffect, useRef } from 'react';
import { fromLonLat } from 'ol/proj';

export const ARROW_TIP = 28;
const ARROW_HALF_WIDTH = 18;
const CORNER_PADDING = ARROW_HALF_WIDTH + 6;
const INSIDE_HIDE_MARGIN = 8;
const CARD_HEADER_HEIGHT = 61;
const HEADER_FILL = '#EFF3FC';

const computeArrowPlacement = (panelRect, featurePixel) => {
    const cx = panelRect.left + panelRect.width / 2;
    const cy = panelRect.top + panelRect.height / 2;
    const dx = featurePixel[0] - cx;
    const dy = featurePixel[1] - cy;
    const halfW = panelRect.width / 2;
    const halfH = panelRect.height / 2;
    if (Math.abs(dx) < halfW - INSIDE_HIDE_MARGIN && Math.abs(dy) < halfH - INSIDE_HIDE_MARGIN) {
        return null;
    }
    if (dx === 0 && dy === 0) return null;

    const ratioX = Math.abs(dx) === 0 ? Infinity : halfW / Math.abs(dx);
    const ratioY = Math.abs(dy) === 0 ? Infinity : halfH / Math.abs(dy);

    let anchorX;
    let anchorY;
    let angleDeg;
    let side;
    if (ratioX < ratioY) {
        const dir = dx > 0 ? 1 : -1;
        anchorX = cx + dir * halfW;
        const intersectY = cy + dy * ratioX;
        const minY = panelRect.top + CORNER_PADDING;
        const maxY = panelRect.bottom - CORNER_PADDING;
        anchorY = Math.max(minY, Math.min(maxY, intersectY));
        angleDeg = dir > 0 ? 0 : 180;
        side = dir > 0 ? 'right' : 'left';
    } else {
        const dir = dy > 0 ? 1 : -1;
        anchorY = cy + dir * halfH;
        const intersectX = cx + dx * ratioY;
        const minX = panelRect.left + CORNER_PADDING;
        const maxX = panelRect.right - CORNER_PADDING;
        anchorX = Math.max(minX, Math.min(maxX, intersectX));
        angleDeg = dir > 0 ? 90 : -90;
        side = dir > 0 ? 'bottom' : 'top';
    }

    const touchesHeader = side === 'top'
        || ((side === 'left' || side === 'right') && anchorY < panelRect.top + CARD_HEADER_HEIGHT);

    return { anchorX, anchorY, angleDeg, touchesHeader };
};

const InfoBoxArrow = ({ panelRef, mapInstance, lngLat, fill = '#FFFFFF', zIndex = 4 }) => {
    const polygonRef = useRef(null);

    useEffect(() => {
        if (!mapInstance || !lngLat) return undefined;

        let rafId = null;
        const tick = () => {
            const panel = panelRef.current;
            const polygon = polygonRef.current;
            if (!panel || !polygon) {
                rafId = requestAnimationFrame(tick);
                return;
            }
            const coord = fromLonLat([lngLat.lng, lngLat.lat]);
            const featurePixel = mapInstance.getPixelFromCoordinate(coord);
            if (!featurePixel) {
                polygon.style.visibility = 'hidden';
                rafId = requestAnimationFrame(tick);
                return;
            }
            const panelRect = panel.getBoundingClientRect();
            const placement = computeArrowPlacement(panelRect, featurePixel);
            if (!placement) {
                polygon.style.visibility = 'hidden';
                rafId = requestAnimationFrame(tick);
                return;
            }
            polygon.style.visibility = 'visible';
            polygon.setAttribute(
                'transform',
                `translate(${placement.anchorX} ${placement.anchorY}) rotate(${placement.angleDeg})`
            );
            polygon.setAttribute('fill', placement.touchesHeader ? HEADER_FILL : fill);
            const angleRad = placement.angleDeg * Math.PI / 180;
            const shadowDx = Math.cos(angleRad) * 3;
            const shadowDy = Math.sin(angleRad) * 3;
            polygon.style.filter = `drop-shadow(${shadowDx.toFixed(2)}px ${shadowDy.toFixed(2)}px 4px rgba(47,73,92,0.22))`;
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        return () => {
            if (rafId !== null) cancelAnimationFrame(rafId);
        };
    }, [mapInstance, lngLat, panelRef, fill]);

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex,
                overflow: 'visible',
            }}
            aria-hidden="true"
        >
            <polygon
                ref={polygonRef}
                points={`${ARROW_TIP},0 0,-${ARROW_HALF_WIDTH} 0,${ARROW_HALF_WIDTH}`}
                fill={fill}
                style={{ visibility: 'hidden' }}
            />
        </svg>
    );
};

export default InfoBoxArrow;
