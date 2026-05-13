import { useEffect, useRef } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useLayers } from '@hooks/useLayers';
import { fetchShare } from '@services/shareService';
import { resolveEmbedLayers } from '@pages/embed/helpers/embedParams';
import { filtersInitializationComplete } from '@pages/maps/hooks/useInitializeFromUrl';
import { useShareDeserializer } from '@pages/maps/hooks/useShareDeserializer';
import { resolveRefToId } from '@pages/maps/helpers/wmsConfig';


const collectShareLayerIds = (envelope, layerTree) => {
    if (!envelope || !envelope.payload) return [];
    const collected = [];
    const seen = new Set();
    const addEntries = (entries, filtersBySlug = null) => {
        entries.forEach((entry) => {
            const slug = entry.slug;
            const id = resolveRefToId(slug, layerTree);
            if (!id || seen.has(id)) return;
            const filterKeys = filtersBySlug
                ? Object.keys(filtersBySlug[slug] || {})
                : Object.keys(entry.filters || {});
            collected.push({ id, hasFilters: filterKeys.length > 0 });
            seen.add(id);
        });
    };
    if (envelope.kind === 'single') {
        addEntries(envelope.payload.layers || []);
    } else if (envelope.kind === 'swipe') {
        addEntries(envelope.payload.paneA?.layers || []);
        addEntries(envelope.payload.paneB?.layers || []);
    }
    return collected;
};


export const useEmbedActivation = ({ shareId, requestedLayers }) => {
    const { setActiveLayerIds, applyDefaultDate, findLayerById } = useMapsContext();
    const { layers } = useLayers();
    const deserialize = useShareDeserializer();
    const appliedRef = useRef(false);

    useEffect(() => {
        if (appliedRef.current) return;
        if (!layers?.length) return;

        if (shareId) {
            appliedRef.current = true;
            const abort = { cancelled: false };
            (async () => {
                try {
                    const envelope = await fetchShare(shareId);
                    if (abort.cancelled) return;
                    filtersInitializationComplete.value = true;
                    if (envelope) {
                        deserialize(envelope);
                        const shareLayers = collectShareLayerIds(envelope, layers);
                        shareLayers.forEach(({ id, hasFilters }) => {
                            if (hasFilters) return;
                            const def = findLayerById?.(id);
                            if (def?.defaultDate && typeof applyDefaultDate === 'function') {
                                applyDefaultDate(id);
                            }
                        });
                    }
                } catch {
                    if (!abort.cancelled) filtersInitializationComplete.value = true;
                }
            })();
            return () => { abort.cancelled = true; };
        }

        const ids = requestedLayers?.length
            ? resolveEmbedLayers(layers, requestedLayers)
            : [];
        if (ids.length > 0) {
            setActiveLayerIds(ids);
            ids.forEach((id) => {
                const def = findLayerById?.(id);
                if (def?.defaultDate && typeof applyDefaultDate === 'function') {
                    applyDefaultDate(id);
                }
            });
        }
        filtersInitializationComplete.value = true;
        appliedRef.current = true;
        return undefined;
    }, [layers, shareId, requestedLayers, setActiveLayerIds, deserialize, applyDefaultDate, findLayerById]);
};
