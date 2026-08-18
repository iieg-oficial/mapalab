import Tooltip from '@components/Tooltip';
import { resolveBadge, isBadgeInValidityWindow } from '@pages/maps/helpers/badgeHelpers';

const fecha = (iso) => {
    if (!iso) return null;
    const [anio, mes, dia] = String(iso).split('-');
    return dia && mes && anio ? `${dia}/${mes}/${anio}` : iso;
};

const LayerBadge = ({ badge, className = '' }) => {
    if (!badge || !badge.enabled || !isBadgeInValidityWindow(badge)) return null;

    const resolved = resolveBadge(badge);
    if (!resolved) return null;

    const desde = fecha(resolved.desde);

    const tooltip = (
        <div className="flex flex-col gap-0.5 leading-tight">
            <span className="font-semibold">{resolved.label}</span>
            {resolved.detalle && <span className="text-[11px] opacity-80">{resolved.detalle}</span>}
            {desde && <span className="text-[11px] opacity-80">Desde el {desde}</span>}
        </div>
    );

    return (
        <Tooltip content={tooltip}>
            <span
                aria-label={resolved.label}
                className={`shrink-0 size-4 rounded-full font-garet font-bold text-[9px]/[12px] inline-flex items-center justify-center ${className}`}
                style={{ color: resolved.color, backgroundColor: resolved.bg }}
            >
                {resolved.inicial}
            </span>
        </Tooltip>
    );
};

export default LayerBadge;
