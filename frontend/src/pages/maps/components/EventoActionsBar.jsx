import { useEffect, useRef, useState } from 'react';
import Icon from '@components/Icon';
import Badge from '@components/Badge';
import Switch from '@components/Switch';
import Tooltip from '@components/Tooltip';
import ReportButton from '@components/ReportButton';
import EventoFunButton from '@mapsComponents/EventoFunButton';
import { buildEventoShareUrl } from '@pages/maps/helpers/eventoHelpers';
import { trackEventoReport, trackEventoShare } from '@services/analyticsService';

const IS_NON_PROD = ['dev', 'beta'].includes(import.meta.env.VITE_APP_ENV);

const BUTTON_BASE = 'px-2.5 py-1.5 rounded-full transition-colors cursor-pointer border border-transparent bg-[#F9FBFF] hover:border-[#70308A] flex items-center gap-1.5';
const PILL_STATIC = 'px-2.5 py-1.5 rounded-full border border-transparent bg-[#F9FBFF] flex items-center gap-1.5';
const LABEL_CLASS = 'font-garet text-[12px] text-graphite';
const COPIED_RESET_MS = 1500;

const EventoActionsBar = ({ evento, externalCount = 0, onApagarExternas }) => {
    const [soloEvento, setSoloEvento] = useState(false);
    const [copied, setCopied] = useState(false);
    const copiedTimerRef = useRef(null);

    useEffect(() => () => {
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    }, []);

    useEffect(() => {
        if (soloEvento && externalCount > 0) onApagarExternas?.();
    }, [soloEvento, externalCount, onApagarExternas]);

    if (!IS_NON_PROD) return null;

    const isPlural = externalCount !== 1;
    const soloTooltip = soloEvento
        ? 'Apaga las capas externas a este evento automaticamente. Toca el switch para desactivar.'
        : externalCount > 0
            ? `Activar para apagar ${externalCount} capa${isPlural ? 's' : ''} externa${isPlural ? 's' : ''} y mantenerlas apagadas`
            : 'Mantiene apagadas las capas que no pertenecen a este evento';

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
            <Badge variant="pill" text="beta" color="orange" size="sm" />

            <Tooltip content={soloTooltip}>
                <div className={PILL_STATIC}>
                    <Switch checked={soloEvento} onChange={setSoloEvento} />
                    <span className={LABEL_CLASS}>Solo este evento</span>
                </div>
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
                </button>
            </Tooltip>

            <div className="ml-auto flex items-center gap-2">
                <EventoFunButton evento={evento} />
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
