import { EXPORT_DIMENSIONS } from './utils/exportDimensions';
import { createSidePanelHeader, createSidePanelTitle } from './utils/sidePanelHeader';
import { createSidePanelLegend } from './utils/sidePanelLegend';
import { createSidePanelMinimap } from './utils/sidePanelMinimap';
import { createSidePanelFooter, createSidePanelLogo } from './utils/sidePanelFooter';
import { createSidePanelSeleccion } from './utils/sidePanelSeleccion';

const createExportSidePanel = (options = {}) => {
    const {
        title,
        captureDate = new Date(),
        selectedLegend = null,
        getLegendUrl,
        viewType = 'viewport',
        viewportExtent = null,
        minimapImageUrl = null,
        minimapBounds = null,
        seleccion = null,
        source = 'Por definir'
    } = options;

    const panelWidth = EXPORT_DIMENSIONS.SIDE_PANEL_WIDTH;
    const contentWidth = EXPORT_DIMENSIONS.SIDE_PANEL_CONTENT_WIDTH;
    const marginRight = EXPORT_DIMENSIONS.SIDE_PANEL_MARGIN_RIGHT;

    const SECTION_PADDING = '30px 40px';
    const SECTION_MARGIN = `8px ${marginRight}px 8px 0`;
    const SECTION_RADIUS = '12px';

    const panel = document.createElement('div');
    Object.assign(panel.style, {
        position: 'absolute',
        top: '0',
        right: '0',
        width: `${panelWidth}px`,
        height: '100%',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        zIndex: '1000',
        boxSizing: 'border-box'
    });

    panel.appendChild(createSidePanelHeader(marginRight, SECTION_RADIUS));

    panel.appendChild(createSidePanelTitle(title, contentWidth, SECTION_MARGIN, SECTION_RADIUS));

    const leyenda = createSidePanelLegend(
        selectedLegend,
        getLegendUrl,
        SECTION_PADDING,
        SECTION_MARGIN,
        SECTION_RADIUS
    );
    panel.appendChild(leyenda);

    const bloqueSeleccion = createSidePanelSeleccion(seleccion, contentWidth, SECTION_MARGIN, SECTION_RADIUS);
    if (bloqueSeleccion) {
        leyenda.style.flex = '0 1 auto';
        panel.appendChild(bloqueSeleccion);
        const relleno = document.createElement('div');
        relleno.style.flex = '1';
        panel.appendChild(relleno);
    }

    panel.appendChild(createSidePanelMinimap(
        minimapImageUrl,
        viewType,
        viewportExtent,
        contentWidth,
        SECTION_MARGIN,
        SECTION_RADIUS,
        minimapBounds
    ));

    panel.appendChild(createSidePanelFooter(
        captureDate,
        source,
        contentWidth,
        marginRight,
        SECTION_PADDING,
        SECTION_RADIUS
    ));

    panel.appendChild(createSidePanelLogo(marginRight, SECTION_PADDING));

    return panel;
};

export default createExportSidePanel;
