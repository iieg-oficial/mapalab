import { transformExtent } from 'ol/proj';
import { useMapCapture } from './useMapCapture';
import coordinateGrid from '../utils/coordinateGrid';
import coordinateLabels from '../utils/coordinateLabels';
import northArrow from '../utils/northArrow';
import createExportSidePanel from '../ExportSidePanel';
import { EXPORT_DIMENSIONS } from '../utils/exportDimensions';

const {
    LABEL_MARGIN_X,
    LABEL_MARGIN_Y,
    MAP_WIDTH,
    MAP_HEIGHT,
    FRAME_BORDER_WIDTH,
    FRAME_COLOR,
    NUM_DIVISIONS_X,
    NUM_DIVISIONS_Y
} = EXPORT_DIMENSIONS;

export const useImageComposition = () => {
    const { captureElement, waitForImages } = useMapCapture();

    const composeExportImage = async ({
        mapCanvas,
        extent,
        sidePanelWidth,
        title,
        selectedLegend,
        getLegendUrl,
        viewType,
        viewportExtent,
        minimapImageUrl,
        minimapBounds,
        scale = 1
    }) => {
        const mapSectionWidth = mapCanvas.width / (scale > 1 ? scale : 1);
        const mapSectionHeight = mapCanvas.height / (scale > 1 ? scale : 1);

        const mapAreaWidth = mapSectionWidth - (LABEL_MARGIN_Y * 2);
        const mapAreaHeight = mapSectionHeight - (LABEL_MARGIN_X * 2);

        const totalWidth = mapSectionWidth + sidePanelWidth;
        const totalHeight = mapSectionHeight;

        const tempContainer = document.createElement('div');
        Object.assign(tempContainer.style, {
            position: 'absolute',
            left: '-9999px',
            width: `${totalWidth}px`,
            height: `${totalHeight}px`,
            backgroundColor: '#ffffff',
            display: 'flex'
        });

        const mapSection = document.createElement('div');
        Object.assign(mapSection.style, {
            position: 'relative',
            width: `${mapSectionWidth}px`,
            height: `${mapSectionHeight}px`,
            flexShrink: 0,
            backgroundColor: '#ffffff'
        });

        const mapFrame = document.createElement('div');
        Object.assign(mapFrame.style, {
            position: 'absolute',
            top: `${LABEL_MARGIN_X}px`,
            left: `${LABEL_MARGIN_Y}px`,
            width: `${mapAreaWidth}px`,
            height: `${mapAreaHeight}px`,
            border: `${FRAME_BORDER_WIDTH}px solid ${FRAME_COLOR}`,
            boxSizing: 'border-box',
            overflow: 'hidden'
        });

        const mapImage = document.createElement('img');
        mapImage.src = mapCanvas.toDataURL('image/png');
        Object.assign(mapImage.style, {
            width: '100%',
            height: '100%',
            display: 'block'
        });

        const gridContainer = document.createElement('div');
        Object.assign(gridContainer.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
        });

        const grid = coordinateGrid(
            mapAreaWidth - (FRAME_BORDER_WIDTH * 2),
            mapAreaHeight - (FRAME_BORDER_WIDTH * 2),
            NUM_DIVISIONS_X,
            NUM_DIVISIONS_Y
        );
        grid.style.top = `${FRAME_BORDER_WIDTH}px`;
        grid.style.left = `${FRAME_BORDER_WIDTH}px`;

        const arrow = northArrow();

        gridContainer.appendChild(grid);
        gridContainer.appendChild(arrow);

        mapFrame.appendChild(mapImage);
        mapFrame.appendChild(gridContainer);

        let frameExtent = extent;
        if (extent) {
            const ext3857 = transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
            const [ex0, ey0, ex1, ey1] = ext3857;
            const ew = ex1 - ex0;
            const eh = ey1 - ey0;
            const cropped = [
                ex0 + (LABEL_MARGIN_Y / MAP_WIDTH) * ew,
                ey0 + (LABEL_MARGIN_X / MAP_HEIGHT) * eh,
                ex1 - (LABEL_MARGIN_Y / MAP_WIDTH) * ew,
                ey1 - (LABEL_MARGIN_X / MAP_HEIGHT) * eh
            ];
            frameExtent = transformExtent(cropped, 'EPSG:3857', 'EPSG:4326');
        }

        const labels = coordinateLabels(mapAreaWidth, mapAreaHeight, frameExtent);

        labels.top.style.position = 'absolute';
        labels.top.style.top = '0';
        labels.top.style.left = `${LABEL_MARGIN_Y}px`;

        labels.bottom.style.position = 'absolute';
        labels.bottom.style.bottom = '0';
        labels.bottom.style.left = `${LABEL_MARGIN_Y}px`;

        labels.left.style.position = 'absolute';
        labels.left.style.top = `${LABEL_MARGIN_X}px`;
        labels.left.style.left = '0';

        labels.right.style.position = 'absolute';
        labels.right.style.top = `${LABEL_MARGIN_X}px`;
        labels.right.style.left = `${LABEL_MARGIN_Y + mapAreaWidth}px`;

        mapSection.appendChild(mapFrame);
        mapSection.appendChild(labels.top);
        mapSection.appendChild(labels.bottom);
        mapSection.appendChild(labels.left);
        mapSection.appendChild(labels.right);

        tempContainer.appendChild(mapSection);

        const sidePanel = createExportSidePanel({
            title,
            captureDate: new Date(),
            selectedLegend,
            getLegendUrl,
            viewType,
            viewportExtent,
            minimapImageUrl,
            minimapBounds,
            source: 'Por definir'
        }); 

        sidePanel.style.position = 'relative';
        sidePanel.style.top = 'auto';
        sidePanel.style.right = 'auto';
        sidePanel.style.height = '100%';
        sidePanel.style.width = `${sidePanelWidth}px`;
        tempContainer.appendChild(sidePanel);

        document.body.appendChild(tempContainer);

        await new Promise((resolve) => {
            if (mapImage.complete) resolve();
            else mapImage.onload = resolve;
        });
        await waitForImages(sidePanel);

        sidePanel.querySelectorAll('img').forEach(img => {
            if (img.naturalWidth > 0 && (!img.style.width || img.style.width === 'auto')) {
                img.style.width = `${img.naturalWidth / 2}px`;
                img.style.height = `${img.naturalHeight / 2}px`;
                img.style.maxWidth = 'none';
            }
        });

        const finalCanvas = await captureElement(tempContainer, { scale: scale > 1 ? scale : 1 });
        document.body.removeChild(tempContainer);

        return finalCanvas;
    };

    return {
        composeExportImage
    };
};
