import { useSyncExternalStore } from 'react';
import { devToolsStore } from '@services/devToolsStore';

const subscribe = devToolsStore.subscribe;

export const useIsNonProd = () =>
    useSyncExternalStore(subscribe, () => devToolsStore.isNonProd());

export const useIsPreviewingProd = () =>
    useSyncExternalStore(subscribe, () => devToolsStore.isPreviewingProd());

export const useIsAnalyticsPanelOpen = () =>
    useSyncExternalStore(subscribe, () => devToolsStore.isAnalyticsPanelOpen());
