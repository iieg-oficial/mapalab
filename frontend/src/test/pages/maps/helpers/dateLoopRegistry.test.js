import { describe, expect, it } from 'vitest';
import { LOOP_INTERVAL_PRESETS, nextLoopInterval } from '@pages/maps/helpers/dateLoopRegistry';
import { slotMembershipOf } from '@pages/maps/helpers/swipeMode';

describe('nextLoopInterval', () => {
    it('recorre los presets y da la vuelta', () => {
        expect(nextLoopInterval(250)).toBe(500);
        expect(nextLoopInterval(LOOP_INTERVAL_PRESETS.at(-1))).toBe(LOOP_INTERVAL_PRESETS[0]);
    });

    it('un valor fuera de los presets vuelve al primero', () => {
        expect(nextLoopInterval(777)).toBe(LOOP_INTERVAL_PRESETS[0]);
        expect(nextLoopInterval(undefined)).toBe(LOOP_INTERVAL_PRESETS[0]);
    });
});

describe('slotMembershipOf', () => {
    const compareMode = {
        active: true,
        paneA: { activeLayerIds: ['lluvia', 'hijo'] },
        paneB: { activeLayerIds: ['lluvia', 'pozos'] },
    };

    it('sin comparador no hay lado', () => {
        expect(slotMembershipOf(null, ['lluvia'])).toBe(null);
        expect(slotMembershipOf({ ...compareMode, active: false }, ['lluvia'])).toBe(null);
    });

    it('distingue A, B, ambos o ninguno', () => {
        expect(slotMembershipOf(compareMode, ['lluvia'])).toBe('AB');
        expect(slotMembershipOf(compareMode, ['hijo'])).toBe('A');
        expect(slotMembershipOf(compareMode, ['pozos'])).toBe('B');
        expect(slotMembershipOf(compareMode, ['otra'])).toBe(null);
    });

    it('un grupo cuenta si cualquiera de sus hijos está en el lado', () => {
        expect(slotMembershipOf(compareMode, ['grupo', 'hijo', 'pozos'])).toBe('AB');
    });
});
