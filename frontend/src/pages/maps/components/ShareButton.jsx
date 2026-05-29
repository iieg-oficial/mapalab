import { useRef, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import Panel from '@components/Panel';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import SharePanel from './SharePanel';
import { useShareDirtiness } from '@pages/maps/hooks/useShareDirtiness';
import { useShareSerializer } from '@pages/maps/hooks/useShareSerializer';
import { createShare } from '@services/shareService';
import { trackShareMap } from '@services/analyticsService';
import { useMapsContext } from '@hooks/useMaps';
import { useSider } from '@contexts/SiderContext';

const LONG_PRESS_MS = 450;
const COPY_FEEDBACK_MS = 2500;

const buildShareUrl = (id) => {
    const base = window.location.origin;
    const path = (import.meta.env.VITE_BASE_PATH || '/').replace(/\/?$/, '/');
    return `${base}${path}mapa?s=${encodeURIComponent(id)}`;
};

const ShareButton = ({ onOpenChange }) => {
    const [open, setOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(null);
    const anchorRef = useRef(null);
    const pressTimer = useRef(null);
    const wasLongPress = useRef(false);
    const copyTimer = useRef(null);

    const { isDirty, loadedShareId, reset } = useShareDirtiness();
    const serialize = useShareSerializer();
    const { compareMode, measurements } = useMapsContext();
    const { isMobile } = useSider();
    const [searchParams, setSearchParams] = useSearchParams();

    const handleClearShare = useCallback(() => {
        const next = new URLSearchParams(searchParams);
        next.delete('s');
        setSearchParams(next, { replace: true });
    }, [searchParams, setSearchParams]);

    const annotationsCount = Array.isArray(measurements)
        ? measurements.filter(m => m?.feature && m.type !== 'Select').length
        : 0;

    useEffect(() => () => {
        clearTimeout(pressTimer.current);
        clearTimeout(copyTimer.current);
    }, []);

    const inSyncWithShare = !!loadedShareId && !isDirty;
    const isModifiedFromShare = !!loadedShareId && isDirty;

    const handleSetOpen = (next) => {
        setOpen(next);
        onOpenChange?.(next);
    };

    const quickGenerateAndCopy = async () => {
        if (generating) return;
        setGenerating(true);
        setError(null);
        try {
            const extra = { includeAnnotations: annotationsCount > 0 };
            const envelope = compareMode?.active
                ? serialize('swipe', { ...extra, position: compareMode.swipePosition ?? 0.5 })
                : serialize('single', extra);
            const result = await createShare(envelope);
            const url = buildShareUrl(result.id);
            try {
                await navigator.clipboard.writeText(url);
            } catch {
                window.prompt('Selecciona y copia este enlace:', url);
            }
            trackShareMap('share_create');
            reset();
            setCopied(true);
            clearTimeout(copyTimer.current);
            copyTimer.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
        } catch (err) {
            setError(err?.message || 'No se pudo crear el enlace');
            clearTimeout(copyTimer.current);
            copyTimer.current = setTimeout(() => setError(null), COPY_FEEDBACK_MS);
        } finally {
            setGenerating(false);
        }
    };

    const startPress = () => {
        wasLongPress.current = false;
        clearTimeout(pressTimer.current);
        pressTimer.current = setTimeout(() => {
            wasLongPress.current = true;
            handleSetOpen(true);
        }, LONG_PRESS_MS);
    };

    const cancelPress = () => {
        clearTimeout(pressTimer.current);
    };

    const handleClick = () => {
        if (wasLongPress.current) {
            wasLongPress.current = false;
            return;
        }
        if (open) {
            handleSetOpen(false);
            return;
        }
        if (isMobile && inSyncWithShare) {
            handleClearShare();
            return;
        }
        quickGenerateAndCopy();
    };

    const tooltipText = error
        ? error
        : copied
            ? '¡Enlace copiado!'
            : generating
                ? 'Generando enlace…'
                : inSyncWithShare
                    ? (isMobile
                        ? `Estás viendo ${loadedShareId}. Toca para desligarte · mantén para opciones.`
                        : `Estás viendo ${loadedShareId}. Click copia enlace nuevo · mantén para opciones.`)
                    : isModifiedFromShare
                        ? 'Estado modificado. Click copia enlace nuevo · mantén para opciones.'
                        : 'Click copia enlace · mantén para opciones';

    const buttonClass = error
        ? 'bg-red-100 border border-red-400 text-red-700'
        : copied
            ? 'bg-[#DCFCE7] border border-[#22C55E] text-[#16A34A]'
            : inSyncWithShare
                ? 'bg-[#DCFCE7] border border-[#22C55E] text-[#16A34A] hover:bg-[#BBF7D0]'
                : isModifiedFromShare
                    ? 'bg-gray-100 border border-gray-400 text-gray-600 hover:bg-gray-200'
                    : generating
                        ? 'bg-purple-deep'
                        : isHovered
                            ? 'bg-purple-deep'
                            : 'bg-purple-soft hover:shadow-[0_6px_6px_#5C247234]';

    const iconNode = error
        ? <Icon name="alert_triangle" className="size-6" />
        : copied
            ? <Icon name="shared_click" state="hover" className="size-6" />
            : inSyncWithShare
                ? <Icon name="done" className="size-6" />
                : (
                    <Icon
                        name="copie"
                        state={(isHovered || generating) && !isModifiedFromShare ? 'hover' : 'normal'}
                        className="size-6"
                    />
                );

    return (
        <div className="flex flex-col relative">
            <Tooltip content={tooltipText} placement="bottom" delay={300}>
                <button
                    ref={anchorRef}
                    type="button"
                    onPointerDown={startPress}
                    onPointerUp={cancelPress}
                    onPointerCancel={cancelPress}
                    onPointerLeave={() => { cancelPress(); setIsHovered(false); }}
                    onPointerEnter={() => setIsHovered(true)}
                    onClick={handleClick}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`cursor-pointer rounded-full size-12.5 flex items-center justify-center transition-colors select-none ${generating ? 'cursor-wait opacity-80' : ''} ${buttonClass}`}
                    aria-label={tooltipText}
                    aria-expanded={open}
                    aria-busy={generating}
                >
                    {iconNode}
                </button>
            </Tooltip>

            <Panel
                open={open}
                anchorRef={anchorRef}
                onClose={() => handleSetOpen(false)}
                variant="solid"
                width="w-80"
                maxHeight="max-md:max-h-[calc(100dvh-6rem)]"
                className="z-50 mt-4 shadow-none border-none rounded-[14px]"
                placement="bottom-end"
                mobileFullscreen={false}
                hideHeader
                noPadding
                bg="bg-transparent"
            >
                <SharePanel
                    isDirty={isDirty}
                    loadedShareId={loadedShareId}
                    onShareCreated={reset}
                />
            </Panel>
        </div>
    );
};

export default ShareButton;
