import { useMapCapture } from './useMapCapture';
import coordinateGrid from '../utils/coordinateGrid';
import northArrow from '../utils/northArrow';
import createExportSidePanel from '../ExportSidePanel';

export const useImageComposition = () => {
    const { captureElement, waitForImages } = useMapCapture();

    const composeExportImage = async ({
        mapCanvas,
        extent,
        sidePanelWidth,
        title,
        selectedLegend,
        getLegendUrl,
        getLegendJson,
        viewType,
        viewportExtent,
        minimapImageUrl,
        scale = 1
    }) => {
        const mapLogicalWidth = mapCanvas.width / (scale > 1 ? scale : 1);
        const mapLogicalHeight = mapCanvas.height / (scale > 1 ? scale : 1);

        const tempContainer = document.createElement('div');
        Object.assign(tempContainer.style, {
            position: 'absolute',
            left: '-9999px',
            width: `${mapLogicalWidth + sidePanelWidth}px`,
            height: `${mapLogicalHeight}px`,
            backgroundColor: '#ffffff',
            display: 'flex'
        });

        const mapSection = document.createElement('div');
        Object.assign(mapSection.style, {
            position: 'relative',
            width: `${mapLogicalWidth}px`,
            height: `${mapLogicalHeight}px`,
            flexShrink: 0
        });

        const mapImage = document.createElement('img');
        mapImage.src = mapCanvas.toDataURL('image/png');
        Object.assign(mapImage.style, {
            width: '100%',
            height: '100%',
            objectFit: 'contain'
        });

        const grid = coordinateGrid(mapLogicalWidth, mapLogicalHeight, extent);
        const arrow = northArrow();

        mapSection.appendChild(mapImage);
        mapSection.appendChild(grid);
        mapSection.appendChild(arrow);
        tempContainer.appendChild(mapSection);

        let legendData = null;
        if (selectedLegend && getLegendJson) {
            try {
                legendData = await getLegendJson(selectedLegend);
            } catch (error) {
                console.error('Error getting legend JSON', error);
            }
        }

        const sidePanel = createExportSidePanel({
            title,
            captureDate: new Date(),
            selectedLegend,
            getLegendUrl,
            legendData,
            viewType,
            viewportExtent,
            minimapImageUrl,
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

        const finalCanvas = await captureElement(tempContainer, { scale: scale > 1 ? scale : 1 });
        document.body.removeChild(tempContainer);

        return finalCanvas;
    };

    return {
        composeExportImage
    };
};
