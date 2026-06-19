import { useSyncExternalStore } from 'react';
import { badgeSeenKey } from './badgeHelpers';

let version = 0;
const listeners = new Set();

const notify = () => {
    version += 1;
    listeners.forEach((l) => l());
};

const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const getSnapshot = () => version;

export const isBadgeSeen = (layerId, badge) => {
    if (!layerId || !badge) return false;
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(badgeSeenKey(layerId, badge)) === '1';
    } catch {
        return false;
    }
};

export const markBadgeSeen = (layerId, badge) => {
    if (!layerId || !badge) return;
    if (isBadgeSeen(layerId, badge)) return;
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(badgeSeenKey(layerId, badge), '1');
        } catch { /* storage lleno o bloqueado */ }
    }
    notify();
};

export const useBadgeSeen = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
