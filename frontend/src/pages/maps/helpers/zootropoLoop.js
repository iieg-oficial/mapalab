import { createPlayerGroup, createTimePlayer, parseKey, toKey } from 'zootropo';

export const LOOP_TIMEOUT_MS = 30000;

const toZootropoKey = (mode, year, key) => (mode === 'year' ? toKey(key) : toKey(year, key));

const fromZootropoKey = (mode, zkey) => {
    const parts = parseKey(zkey);
    return mode === 'year' ? parts.year : parts.month;
};

export const toZootropoDirection = (direction, descending) => ((direction === 'rtl') === descending ? 'forward' : 'backward');

export const createLoopPlayer = ({ mode, year = null, values, intervalMs, direction, onStep, onTimeout }) => {
    const keys = values.map(v => toZootropoKey(mode, year, v.key));
    const byKey = new Map(keys.map((zkey, index) => [zkey, values[index]]));
    const descending = keys.length > 1 && keys[0] > keys[keys.length - 1];
    const player = createTimePlayer({
        catalog: keys,
        mode,
        initial: keys,
        intervalMs,
        direction: toZootropoDirection(direction, descending),
        timeoutMs: LOOP_TIMEOUT_MS,
        onEvent: (event) => {
            if (event.type === 'step') onStep(byKey.get(event.key));
            else if (event.type === 'timeout') onTimeout();
        },
    });
    return {
        player,
        mode,
        year,
        values,
        descending,
        zkey: (key) => toZootropoKey(mode, year, key),
        seek: (key) => player.seek(toZootropoKey(mode, year, key)),
        currentKey: () => {
            const step = player.getSnapshot().step;
            return step ? fromZootropoKey(mode, step) : null;
        },
        setDirection: (dir) => player.setDirection(toZootropoDirection(dir, descending)),
    };
};

export const createLoopGroup = (loops, { intervalMs, direction }) => {
    const [first] = loops;
    const group = createPlayerGroup(loops.map(loop => loop.player), {
        intervalMs,
        direction: toZootropoDirection(direction, first.descending),
        timeoutMs: LOOP_TIMEOUT_MS,
    });
    return {
        group,
        loops,
        seek: (key) => group.seek(first.zkey(key)),
        setDirection: (dir) => group.setDirection(toZootropoDirection(dir, first.descending)),
    };
};
