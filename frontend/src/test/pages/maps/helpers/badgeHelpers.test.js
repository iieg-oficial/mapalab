import { describe, it, expect } from 'vitest';
import {
    resolveBadge,
    isBadgeInValidityWindow,
    badgeContentHash,
    badgeSeenKey,
    pickLayerBadge,
    themeHasUnseenBadge,
} from '@pages/maps/helpers/badgeHelpers';

describe('resolveBadge', () => {
    it('retorna null sin badge', () => {
        expect(resolveBadge(null)).toBeNull();
    });

    it('resuelve preset con label y color por defecto', () => {
        expect(resolveBadge({ variant: 'new' })).toMatchObject({
            label: 'Nueva',
            inicial: 'N',
            color: '#1F9D55',
            bg: '#1F9D551A',
        });
    });

    it('permite override de label en preset', () => {
        expect(resolveBadge({ variant: 'updated', label: 'Revisada' })).toMatchObject({
            label: 'Revisada',
            color: '#2563EB',
        });
    });

    it('usa color y label en custom', () => {
        expect(resolveBadge({ variant: 'custom', label: 'Beta', color: '#112233' })).toMatchObject({
            label: 'Beta',
            inicial: 'B',
            color: '#112233',
            bg: '#1122331A',
        });
    });

    it('retorna null si custom sin color o label', () => {
        expect(resolveBadge({ variant: 'custom', label: 'Beta' })).toBeNull();
        expect(resolveBadge({ variant: 'custom', color: '#112233' })).toBeNull();
    });
});

describe('isBadgeInValidityWindow', () => {
    const now = new Date('2026-06-15T12:00:00Z');

    it('sin fechas siempre vigente', () => {
        expect(isBadgeInValidityWindow({}, now)).toBe(true);
    });

    it('antes de validFrom no vigente', () => {
        expect(isBadgeInValidityWindow({ validFrom: '2026-07-01' }, now)).toBe(false);
    });

    it('despues de validUntil no vigente', () => {
        expect(isBadgeInValidityWindow({ validUntil: '2026-06-01' }, now)).toBe(false);
    });

    it('dentro de la ventana vigente', () => {
        expect(isBadgeInValidityWindow({ validFrom: '2026-06-01', validUntil: '2026-06-30' }, now)).toBe(true);
    });
});

describe('badgeContentHash / badgeSeenKey', () => {
    it('cambia el hash cuando cambia el contenido', () => {
        const a = badgeContentHash({ variant: 'new', label: 'Nueva' });
        const b = badgeContentHash({ variant: 'updated', label: 'Actualizada' });
        expect(a).not.toBe(b);
    });

    it('mismo contenido produce el mismo hash', () => {
        const a = badgeContentHash({ variant: 'new', validUntil: '2026-07-01' });
        const b = badgeContentHash({ variant: 'new', validUntil: '2026-07-01' });
        expect(a).toBe(b);
    });

    it('seenKey incluye layerId y hash', () => {
        const badge = { variant: 'new' };
        expect(badgeSeenKey('cap-1', badge)).toBe(`mapalab.badge.seen.cap-1.${badgeContentHash(badge)}`);
    });
});

describe('pickLayerBadge', () => {
    const now = new Date('2026-06-15T12:00:00Z');

    it('null si no esta enabled', () => {
        expect(pickLayerBadge({ badge: { variant: 'new', enabled: false } }, now)).toBeNull();
    });

    it('null si fuera de vigencia', () => {
        expect(pickLayerBadge({ badge: { variant: 'new', enabled: true, validUntil: '2026-01-01' } }, now)).toBeNull();
    });

    it('resuelve si enabled y vigente', () => {
        expect(pickLayerBadge({ badge: { variant: 'new', enabled: true } }, now)).toMatchObject({ label: 'Nueva' });
    });
});

describe('themeHasUnseenBadge', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    const theme = {
        id: 'tema',
        children: [
            { id: 'sub', children: [
                { id: 'cap-1', badge: { variant: 'new', enabled: true } },
                { id: 'cap-2' },
            ] },
        ],
    };

    it('true si hay badge vigente no visto', () => {
        expect(themeHasUnseenBadge(theme, () => false, now)).toBe(true);
    });

    it('false si la unica capa con badge ya fue vista', () => {
        const isSeen = (id) => id === 'cap-1';
        expect(themeHasUnseenBadge(theme, isSeen, now)).toBe(false);
    });

    it('false si el badge no esta vigente', () => {
        const expired = {
            id: 'tema',
            children: [{ id: 'cap-1', badge: { variant: 'new', enabled: true, validUntil: '2026-01-01' } }],
        };
        expect(themeHasUnseenBadge(expired, () => false, now)).toBe(false);
    });

    it('false si el tema no tiene hijos', () => {
        expect(themeHasUnseenBadge({ id: 'x' }, () => false, now)).toBe(false);
    });
});

describe('resolveBadge - inicial y detalle para el tooltip', () => {
    it('toma la inicial en mayúscula del label', () => {
        expect(resolveBadge({ variant: 'updated' }).inicial).toBe('A');
        expect(resolveBadge({ variant: 'soon' }).inicial).toBe('P');
    });

    it('usa la inicial del label propio cuando lo hay', () => {
        expect(resolveBadge({ variant: 'new', label: 'beta' }).inicial).toBe('B');
    });

    it('cada preset trae su descripción', () => {
        expect(resolveBadge({ variant: 'updated' }).detalle).toContain('actualización');
    });

    it('un badge custom no inventa descripción', () => {
        expect(resolveBadge({ variant: 'custom', label: 'X', color: '#112233' }).detalle).toBe(null);
    });

    it('arrastra las fechas de vigencia para el tooltip', () => {
        const b = resolveBadge({ variant: 'new', validFrom: '2026-08-01', validUntil: '2026-09-01' });
        expect(b.desde).toBe('2026-08-01');
        expect(b.hasta).toBe('2026-09-01');
    });
});
