import { useMapsContext } from '@hooks/useMaps';
import { nextLoopInterval } from '../helpers/dateLoopRegistry';

export const useActiveLayerLoop = (layerId, compareActive) => {
    const { getLoopState, toggleLoop, inferLoopConfig, getLoopPrefs, setLoopIntervalMs, setLoopDirection } = useMapsContext();
    const { intervalMs: loopIntervalMs, direction: loopDirection } = getLoopPrefs?.(layerId) || {};
    const isLooping = getLoopState?.(layerId)?.isPlaying;
    const canPlayLoop = !!isLooping || inferLoopConfig?.(layerId) != null;
    const slotLoops = compareActive ? Object.fromEntries(['A', 'B'].map(slot => {
        const state = getLoopState?.(layerId, slot);
        return [slot, { isLooping: !!state?.isPlaying, canPlay: !!state || inferLoopConfig?.(layerId, slot) != null }];
    })) : null;

    const handlePlayClick = (e, slot) => { e.stopPropagation(); toggleLoop?.(layerId, null, slot); };
    const handleIntervalClick = (e) => { e.stopPropagation(); setLoopIntervalMs?.(layerId, nextLoopInterval(loopIntervalMs)); };
    const handleDirectionClick = (e) => { e.stopPropagation(); setLoopDirection?.(layerId, loopDirection === 'rtl' ? 'ltr' : 'rtl'); };

    return {
        isLooping, canPlayLoop, slotLoops, loopIntervalMs, loopDirection,
        handlePlayClick, handleIntervalClick, handleDirectionClick,
    };
};
