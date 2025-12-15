import { createWMSConfig } from '../../wmsConfig';

const buildWmsConfig = (workspace, layerName, options = {}) => {
    const { styles = '', cqlFilter = '', ...rest } = options;

    return {
        ...createWMSConfig(workspace, layerName, styles, cqlFilter),
        ...rest
    };
};

export const createLayerFactory = (workspace) => {
    const createLayer = (layerName, options) =>
        buildWmsConfig(workspace, layerName, options);

    createLayer.withFilter = (layerName, filter, options = {}) =>
        createLayer(layerName, { ...options, cqlFilter: filter });

    createLayer.withStyles = (layerName, styles, options = {}) =>
        createLayer(layerName, { ...options, styles });

    return createLayer;
};
