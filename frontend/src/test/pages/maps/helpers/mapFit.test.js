import { describe, it, expect } from 'vitest';
import { getFitPadding, ACTIVE_LAYERS_PANEL_WIDTH } from '@pages/maps/helpers/mapFit';

describe('getFitPadding', () => {
    it('desktop: padding asimétrico [top,right,bottom,left] con sider a la izquierda y panel a la derecha', () => {
        const [top, right, bottom, left] = getFitPadding({
            mapSize: [1400, 900],
            siderWidth: 88,
            rightPanelWidth: ACTIVE_LAYERS_PANEL_WIDTH,
            isMobile: false,
        });
        expect(left).toBe(16 + 88 + 14);
        expect(right).toBe(16 + 373 + 14);
        expect(top).toBe(50);
        expect(bottom).toBe(30);
    });

    it('sider expandido aumenta el padding izquierdo', () => {
        const collapsed = getFitPadding({ mapSize: [1400, 900], siderWidth: 88, rightPanelWidth: 373 });
        const expanded = getFitPadding({ mapSize: [1400, 900], siderWidth: 340, rightPanelWidth: 373 });
        expect(expanded[3]).toBeGreaterThan(collapsed[3]);
        expect(expanded[3]).toBe(16 + 340 + 14);
    });

    it('mobile: padding simétrico chico, ignora anchos de paneles', () => {
        const pad = getFitPadding({ mapSize: [400, 800], siderWidth: 88, rightPanelWidth: 373, isMobile: true });
        expect(pad).toEqual([28, 40, 28, 40]);
    });

    it('clampa horizontal cuando los paneles superan el 80% del ancho del mapa', () => {
        const [, right, , left] = getFitPadding({
            mapSize: [600, 900],
            siderWidth: 340,
            rightPanelWidth: 373,
            isMobile: false,
        });
        expect(left + right).toBeLessThanOrEqual(Math.round(600 * 0.8) + 1);
        expect(left).toBeGreaterThan(0);
        expect(right).toBeGreaterThan(0);
    });

    it('sin mapSize devuelve padding asimétrico sin clamp', () => {
        const pad = getFitPadding({ siderWidth: 88, rightPanelWidth: 373 });
        expect(pad).toEqual([50, 403, 30, 118]);
    });
});
