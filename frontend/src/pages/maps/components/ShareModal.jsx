import { useState, useRef, useEffect } from 'react';
import Modal from '@components/Modal';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useShareSerializer } from '@pages/maps/hooks/useShareSerializer';
import { createShare, pinShare } from '@services/shareService';
import { trackShareMap } from '@services/analyticsService';
import { useMapsContext } from '@hooks/useMaps';

const buildShareUrl = (id) => {
    const base = window.location.origin;
    const path = (import.meta.env.VITE_BASE_PATH || '/').replace(/\/?$/, '/');
    return `${base}${path}mapa?s=${encodeURIComponent(id)}`;
};

export default function ShareModal({ open, onClose, isDirty = false, loadedShareId = null, onShareCreated }) {
    const serialize = useShareSerializer();
    const { compareMode } = useMapsContext();
    const [creating, setCreating] = useState(false);
    const [share, setShare] = useState(null);
    const [pinned, setPinned] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [copyHovered, setCopyHovered] = useState(false);
    const copyTimerRef = useRef(null);

    useEffect(() => () => clearTimeout(copyTimerRef.current), []);

    const handleCreate = async () => {
        setCreating(true);
        setError(null);
        setPinned(false);
        try {
            let envelope;
            if (compareMode?.active) {
                envelope = serialize('swipe', {
                    axis: compareMode.axis,
                    panes: compareMode.panes,
                    position: compareMode.swipePosition ?? 0.5,
                });
            } else {
                envelope = serialize('single');
            }
            const result = await createShare(envelope);
            setShare(result);
            trackShareMap('share_create');
            onShareCreated?.();
        } catch (err) {
            setError(err.message || 'Error al crear el enlace');
        } finally {
            setCreating(false);
        }
    };

    const handleCopy = async () => {
        if (!share) return;
        const url = buildShareUrl(share.id);
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            clearTimeout(copyTimerRef.current);
            copyTimerRef.current = setTimeout(() => setCopied(false), 2500);
        } catch {
            window.prompt('Copia el enlace:', url);
        }
    };

    const handlePin = async () => {
        if (!share) return;
        try {
            const result = await pinShare(share.id);
            setPinned(true);
            setShare(prev => ({ ...prev, pinned_until: result.pinnedUntil }));
            trackShareMap('share_pin');
        } catch (err) {
            setError(err.message || 'Error al fijar enlace');
        }
    };

    const handleClose = () => {
        setShare(null);
        setPinned(false);
        setError(null);
        onClose?.();
    };

    if (!open) return null;

    const url = share ? buildShareUrl(share.id) : null;

    return (
        <Modal isOpen={open} onClose={handleClose} title="Compartir mapa" width="max-w-lg">
            <div className="flex flex-col gap-4 p-4">
                {loadedShareId && !isDirty && !share && (
                    <div className="rounded-md bg-[#DCFCE7] text-[#16A34A] border border-[#22C55E] px-3 py-2 text-sm">
                        Usando link compartido: <span className="font-bold tabular-nums">{loadedShareId}</span>
                    </div>
                )}
                {isDirty && !share && (
                    <div className="rounded-md border border-[#FF8300]/40 bg-[#FFF7EE] p-3 text-sm text-[#7A4D00]">
                        <strong className="font-bold">Estado modificado.</strong> Cargaste un enlace
                        {loadedShareId ? ` (${loadedShareId})` : ''} y luego cambiaste capas, filtros
                        o vista. Crea un enlace nuevo para guardar el estado actual.
                    </div>
                )}
                <p className="text-sm text-gray-700">
                    Genera un enlace permanente al estado actual del mapa. Los enlaces se conservan
                    30 dias desde el ultimo acceso. Fija el enlace para garantizar 1 ano.
                </p>
                {!share && (
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={creating}
                        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                    >
                        {creating ? 'Creando...' : 'Crear enlace'}
                    </button>
                )}
                {share && url && (
                    <>
                        <div className="flex gap-2 items-center">
                            <input
                                type="text"
                                value={url}
                                readOnly
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                            />
                            <Tooltip content={copied ? '¡Enlace copiado!' : 'Copiar enlace'} placement="top" delay={300}>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    onMouseEnter={() => setCopyHovered(true)}
                                    onMouseLeave={() => setCopyHovered(false)}
                                    className={`cursor-pointer rounded-full size-12.5 flex items-center justify-center transition-colors shrink-0 ${copied || copyHovered ? 'bg-[#703088]' : 'bg-[#F7F0FA]'}`}
                                    aria-label={copied ? 'Enlace copiado' : 'Copiar enlace'}
                                >
                                    <Icon
                                        name={copied ? 'shared_click' : 'copie'}
                                        state={copied || copyHovered ? 'hover' : 'normal'}
                                        className="size-6"
                                    />
                                </button>
                            </Tooltip>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handlePin}
                                disabled={pinned}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-sm disabled:opacity-60"
                            >
                                {pinned ? 'Fijado por 1 ano' : 'Fijar 1 ano'}
                            </button>
                            <span className="text-xs text-gray-500">
                                {pinned
                                    ? 'Este enlace ya no se eliminara automaticamente.'
                                    : 'Sin fijar: vence si no se usa por 30 dias.'}
                            </span>
                        </div>
                    </>
                )}
                {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
        </Modal>
    );
}
