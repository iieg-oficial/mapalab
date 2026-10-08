import { buildLayerIndex, stringHash } from './noticeHelpers';

export { buildLayerIndex };

const BADGE_PRESETS = {
    new: { label: 'Nueva', color: '#1F9D55', detalle: 'Esta capa se publicó recientemente' },
    updated: { label: 'Actualizada', color: '#2563EB', detalle: 'Esta capa recibió una actualización' },
    soon: { label: 'Próximamente', color: '#FF8300', detalle: 'Esta capa está por publicarse' },
};

const softBg = (hex) => {
    if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) return 'transparent';
    return `${hex}1A`;
};

export const resolveBadge = (badge) => {
    if (!badge) return null;
    const preset = BADGE_PRESETS[badge.variant];
    const color = badge.variant === 'custom' ? badge.color : preset?.color;
    const label = badge.label || preset?.label;
    if (!color || !label) return null;
    return {
        label,
        inicial: label.trim().charAt(0).toUpperCase(),
        detalle: preset?.detalle || null,
        desde: badge.validFrom || null,
        hasta: badge.validUntil || null,
        color,
        bg: softBg(color)
    };
};

export const isBadgeInValidityWindow = (badge, now = new Date()) => {
    if (!badge) return false;
    const { validFrom, validUntil } = badge;
    const today = now.toISOString().slice(0, 10);
    if (validFrom && today < validFrom) return false;
    if (validUntil && today > validUntil) return false;
    return true;
};

export const badgeContentHash = (badge) => {
    if (!badge) return '';
    const payload = JSON.stringify({
        v: badge.variant || '',
        l: badge.label || '',
        c: badge.color || '',
        f: badge.validFrom || '',
        u: badge.validUntil || '',
    });
    return stringHash(payload);
};

export const badgeSeenKey = (layerId, badge) =>
    `mapalab.badge.seen.${layerId}.${badgeContentHash(badge)}`;

export const pickLayerBadge = (node, now = new Date()) => {
    const badge = node?.badge;
    if (!badge || !badge.enabled) return null;
    if (!isBadgeInValidityWindow(badge, now)) return null;
    return resolveBadge(badge);
};

export const themeHasUnseenBadge = (themeNode, isSeen, now = new Date()) => {
    const walk = (node) => {
        const badge = node?.badge;
        if (badge && badge.enabled && isBadgeInValidityWindow(badge, now) && !isSeen(node.id, badge)) {
            return true;
        }
        return Array.isArray(node?.children) && node.children.some(walk);
    };
    return Array.isArray(themeNode?.children) && themeNode.children.some(walk);
};
