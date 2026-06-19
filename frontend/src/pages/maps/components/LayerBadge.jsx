import { resolveBadge, isBadgeInValidityWindow } from '@pages/maps/helpers/badgeHelpers';

const LayerBadge = ({ badge, className = '' }) => {
    if (!badge || !badge.enabled || !isBadgeInValidityWindow(badge)) return null;

    const resolved = resolveBadge(badge);
    if (!resolved) return null;

    return (
        <span
            className={`shrink-0 px-1.5 py-0.5 rounded-full font-garet font-bold text-[9px]/[12px] uppercase tracking-wide leading-none ${className}`}
            style={{ color: resolved.color, backgroundColor: resolved.bg }}
        >
            {resolved.label}
        </span>
    );
};

export default LayerBadge;
