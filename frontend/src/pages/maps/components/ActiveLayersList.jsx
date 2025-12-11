import { useContext, useCallback } from 'react';
import MapsContext from '@contexts/MapsContext';
import { useActiveLayersLogic } from '../hooks/useActiveLayersLogic';
import { useLayerCollapse } from '../hooks/useLayerCollapse';
import CollapsedLayersView from './CollapsedLayersView';
import ExpandedLayersView from './ExpandedLayersView';

const ActiveLayersList = () => {
    const {
        activeLayerIds,
        onToggleLayer,
        selectedLayerForSymbology,
        reorderActiveLayerIds,
        hiddenLayerIds
    } = useContext(MapsContext);
    const layersLogic = useActiveLayersLogic(activeLayerIds, hiddenLayerIds);
    const collapse = useLayerCollapse(layersLogic.unifiedLayers, selectedLayerForSymbology !== null);
    const isInegiMode = activeLayerIds.some(id => ['limite_inegi', 'limite_municipal_inegi'].includes(id));

    const handleToggleBaseMode = useCallback(() => {
        if (isInegiMode) {
            ['limite_inegi', 'limite_municipal_inegi'].forEach(id => onToggleLayer(id, false));
            ['regiones', 'limite_municipal', 'limite_iieg'].forEach(id => onToggleLayer(id, true));
        } else {
            ['limite_iieg', 'limite_municipal', 'regiones'].forEach(id => onToggleLayer(id, false));
            ['limite_municipal_inegi', 'limite_inegi'].forEach(id => onToggleLayer(id, true));
        }
    }, [isInegiMode, onToggleLayer]);


    if (collapse.isCollapsed) {
        return (
            <CollapsedLayersView
                unifiedLayers={layersLogic.unifiedLayers}
                isManuallyCollapsed={collapse.isManuallyCollapsed}
                shouldAlignRight={collapse.shouldAlignRight}
                onExpand={collapse.handleExpand}
            />
        );
    }

    return (
        <ExpandedLayersView
            unifiedLayers={layersLogic.unifiedLayers}
            isManuallyCollapsed={collapse.isManuallyCollapsed}
            onManualCollapse={collapse.handleManualCollapse}
            isInegiMode={isInegiMode}
            onToggleBaseMode={handleToggleBaseMode}
            activeLayerIds={activeLayerIds}
            onReorder={reorderActiveLayerIds}
        />
    );
};

export default ActiveLayersList;
