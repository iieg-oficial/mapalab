const listeners = new Set();
const events = [];

export const debugStore = {
    emit(entry) {
        events.push(entry);
        if (events.length > 50) events.shift();
        listeners.forEach(fn => fn([...events]));
    },
    subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    },
    getEvents() {
        return [...events];
    }
};
