import { useEffect, useRef, useState } from 'react';
import Icon from '@components/Icon';
import Badge from '@components/Badge';
import Tooltip from '@components/Tooltip';
import ReportButton from '@components/ReportButton';
import { buildEventoShareUrl } from '@pages/maps/helpers/eventoHelpers';
import { trackEventoReport, trackEventoShare } from '@services/analyticsService';

const IS_NON_PROD = ['dev', 'beta'].includes(import.meta.env.VITE_APP_ENV);

const BUTTON_BASE = 'px-2.5 py-1.5 rounded-full transition-colors cursor-pointer border border-transparent bg-[#F9FBFF] hover:border-[#70308A] flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-transparent';
const LABEL_CLASS = 'font-garet text-[12px] text-graphite';
const COPIED_RESET_MS = 1500;

const EventoActionsBar = ({ evento, externalCount = 0, onApagarExternas }) => {
    const [copied, setCopied] = useState(false);
    const copiedTimerRef = useRef(null);

    useEffect(() => () => {
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    }, []);

    if (!IS_NON_PROD) return null;

    const isPlural = externalCount !== 1;
    const hideDisabled = externalCount === 0;
    const hideTooltip = hideDisabled
        ? 'No hay capas activas fuera de este evento'
        : `Apaga ${externalCount} capa${isPlural ? 's' : ''} activa${isPlural ? 's' : ''} que no pertenece${isPlural ? 'n' : ''} a este evento`;

    const handleShare = async () => {
        if (!evento?.id) return;
        const url = buildEventoShareUrl(evento);
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            trackEventoShare(evento.id, 'ok');
            if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
            copiedTimerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
        } catch {
            trackEventoShare(evento.id, 'error');
        }
    };

    const shareTooltip = copied ? 'Enlace copiado' : 'Copiar enlace al evento';

    return (
        <div className="px-4 pt-1 pb-2 flex items-center gap-2 flex-wrap shrink-0">
            <Tooltip content={hideTooltip}>
                <button
                    type="button"
                    disabled={hideDisabled}
                    onClick={onApagarExternas}
                    className={BUTTON_BASE}
                >
                    <Icon name="visible" state={hideDisabled ? 'gray' : 'hover'} className="size-4" />
                    <span className={LABEL_CLASS}>Ocultar otras ({externalCount})</span>
                    <Badge variant="pill" text="beta" color="orange" size="sm" />
                </button>
            </Tooltip>

            <Tooltip content={shareTooltip}>
                <button
                    type="button"
                    onClick={handleShare}
                    className={BUTTON_BASE}
                >
                    {copied ? (
                        <Icon name="done" className="size-4 text-[#16A34A]" />
                    ) : (
                        <Icon name="copie" className="size-4" />
                    )}
                    <span className={LABEL_CLASS}>{copied ? 'Copiado' : 'Compartir'}</span>
                    <Badge variant="pill" text="beta" color="orange" size="sm" />
                </button>
            </Tooltip>

            <div className="ml-auto flex items-center gap-1.5">
                <Badge variant="pill" text="beta" color="orange" size="sm" />
                <ReportButton
                    variant="floating"
                    label="Reportar problema con este evento"
                    extraContext={{
                        source: 'evento_actions_bar',
                        evento_id: evento?.id,
                        evento_titulo: evento?.titulo,
                    }}
                    onTrack={() => evento?.id && trackEventoReport(evento.id)}
                />
            </div>
        </div>
    );
};

export default EventoActionsBar;
