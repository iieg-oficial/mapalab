import { useState, useCallback, useRef, useEffect } from 'react';
import { trackLayerDownload } from '@services/analyticsService';
import { isRasterLayer, downloadSingleFormat, downloadWithMenu, getAvailableMetadata } from '@services/downloadService';

const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export { formatBytes };

export const useLayerDownload = (layerId, { getFilter, getSpecificFilter, metadata, cqlBase = null, propertyNames = null } = {}) => {
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const abortRef = useRef(null);
    const menuAnchorRef = useRef(null);

    const isRaster = layerId ? isRasterLayer(layerId) : false;
    const hasDateFilter = !!getSpecificFilter?.(layerId, 'date');
    const downloadDisabled = downloading;
    const availableMetadata = getAvailableMetadata(metadata);

    const handleQuickDownload = useCallback(async () => {
        if (!layerId || downloadDisabled) return;
        const controller = new AbortController();
        abortRef.current = controller;
        setDownloading(true);
        setProgress({ loaded: 0 });

        const defaultFormat = isRaster ? 'geotiff' : 'csv';
        const result = await downloadSingleFormat(layerId, defaultFormat, {
            signal: controller.signal,
            onProgress: setProgress,
            getFilter,
        });

        abortRef.current = null;
        setDownloading(false);
        setProgress(null);
        if (result?.success) {
            trackLayerDownload(layerId);
        }
    }, [layerId, downloadDisabled, isRaster, getFilter]);

    const handleMenuDownload = useCallback(async (menuOptions) => {
        if (!layerId || downloading) return;
        const controller = new AbortController();
        abortRef.current = controller;
        setDownloading(true);
        setProgress({ loaded: 0 });
        setMenuOpen(false);

        const result = await downloadWithMenu(layerId, {
            ...menuOptions,
            metadata,
            signal: controller.signal,
            onProgress: setProgress,
            getFilter,
            getSpecificFilter,
            cqlBase,
            propertyNames,
        });

        abortRef.current = null;
        setDownloading(false);
        setProgress(null);
        if (result?.success) {
            trackLayerDownload(layerId);
        }
    }, [layerId, downloading, metadata, getFilter, getSpecificFilter, cqlBase, propertyNames]);

    const handleCancelDownload = useCallback(() => {
        abortRef.current?.abort();
    }, []);

    useEffect(() => {
        return () => { abortRef.current?.abort(); };
    }, []);

    return {
        downloading,
        progress,
        menuOpen,
        setMenuOpen,
        menuAnchorRef,
        downloadDisabled,
        isRaster,
        hasDateFilter,
        availableMetadata,
        handleQuickDownload,
        handleMenuDownload,
        handleCancelDownload,
    };
};
