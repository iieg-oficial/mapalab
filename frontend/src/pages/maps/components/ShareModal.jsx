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


const buildEmbedSnippet = (id) => {
    const base = window.location.origin;
    const path = (import.meta.env.VITE_BASE_PATH || '/').replace(/\/?$/, '/');
    return [
        `<script src="${base}${path}widget/v1/mapalab.js" defer></script>`,
        ``,
        `<iieg-mapalab`,
        `    api-key="mk_pub_TU_API_KEY"`,
        `    share="${id}"`,
        `    height="500">`,
        `</iieg-mapalab>`,
    ].join('\n');
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
    const [tab, setTab] = useState('link');
    const [snippetCopied, setSnippetCopied] = useState(false);
    const copyTimerRef = useRef(null);
    const snippetTimerRef = useRef(null);

    useEffect(() => () => {
        clearTimeout(copyTimerRef.current);
        clearTimeout(snippetTimerRef.current);
    }, []);

    const handleCreate = async () => {
        setCreating(true);
        setError(null);
        setPinned(false);
        try {
            let envelope;
            if (compareMode?.active) {
                envelope = serialize('swipe', {
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
            setError(err.message || 'No se pudo crear el enlace para compartir');
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
            window.prompt('Selecciona y copia este enlace:', url);
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
            setError(err.message || 'No se pudo fijar el enlace');
        }
    };

    const handleCopySnippet = async () => {
        if (!share) return;
        const snippet = buildEmbedSnippet(share.id);
        try {
            await navigator.clipboard.writeText(snippet);
            setSnippetCopied(true);
            clearTimeout(snippetTimerRef.current);
            snippetTimerRef.current = setTimeout(() => setSnippetCopied(false), 2500);
        } catch {
            window.prompt('Selecciona y copia este código:', snippet);
        }
    };

    const handleClose = () => {
        setShare(null);
        setPinned(false);
        setError(null);
        setTab('link');
        onClose?.();
    };

    if (!open) return null;

    const url = share ? buildShareUrl(share.id) : null;

    return (
        <Modal isOpen={open} onClose={handleClose} title="Compartir mapa" width="max-w-lg">
            <div className="flex flex-col gap-4 p-4">
                {loadedShareId && !isDirty && !share && (
                    <div className="rounded-md bg-[#DCFCE7] text-[#16A34A] border border-[#22C55E] px-3 py-2 text-sm">
                        Estás viendo un mapa compartido: <span className="font-bold tabular-nums">{loadedShareId}</span>
                    </div>
                )}
                {isDirty && !share && (
                    <div className="rounded-md border border-[#FF8300]/40 bg-[#FFF7EE] p-3 text-sm text-[#7A4D00]">
                        <strong className="font-bold">Hiciste cambios al mapa.</strong> Abriste un mapa compartido
                        {loadedShareId ? ` (${loadedShareId})` : ''} y le modificaste capas, filtros o vista.
                        Genera un enlace nuevo si quieres guardar el mapa como está ahora.
                    </div>
                )}
                <p className="text-sm text-gray-700">
                    Genera un enlace para compartir el mapa tal como lo estás viendo. Los enlaces se conservan
                    durante 30 días desde el último uso. Si quieres asegurar que dure un año entero, fíjalo después de crearlo.
                </p>
                {!share && (
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={creating}
                        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                    >
                        {creating ? 'Generando…' : 'Generar enlace para compartir'}
                    </button>
                )}
                {share && url && (
                    <>
                        <div className="flex gap-1 border-b border-gray-200">
                            <button
                                type="button"
                                onClick={() => setTab('link')}
                                className={`px-3 py-2 text-sm border-b-2 -mb-px ${tab === 'link' ? 'border-[#703088] text-[#703088] font-medium' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
                            >
                                Compartir enlace
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab('embed')}
                                className={`px-3 py-2 text-sm border-b-2 -mb-px ${tab === 'embed' ? 'border-[#703088] text-[#703088] font-medium' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
                            >
                                Insertar en otro sitio
                            </button>
                        </div>

                        {tab === 'link' && (
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
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={handlePin}
                                        disabled={pinned}
                                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-sm disabled:opacity-60"
                                    >
                                        {pinned ? 'Fijado por 1 año' : 'Fijar enlace por 1 año'}
                                    </button>
                                    <span className="text-xs text-gray-500">
                                        {pinned
                                            ? 'Este enlace ya no se va a eliminar de forma automática.'
                                            : 'Si nadie lo usa durante 30 días, el enlace se borra. Fíjalo para garantizar un año.'}
                                    </span>
                                </div>
                            </>
                        )}

                        {tab === 'embed' && (
                            <div className="flex flex-col gap-3">
                                <p className="text-xs text-gray-600">
                                    Copia este código y pégalo en el HTML de tu página web para mostrar este mapa.
                                    Reemplaza
                                    <code className="mx-1 px-1 bg-gray-100 rounded">mk_pub_TU_API_KEY</code>
                                    por la contraseña de la llave que te entregó el equipo del IIEG.
                                    Si aún no tienes una llave, pídela enviando este código de mapa:
                                    <span className="font-mono font-semibold ml-1">{share.id}</span>.
                                </p>
                                <pre className="bg-gray-900 text-gray-100 text-xs p-3 rounded overflow-x-auto whitespace-pre">{buildEmbedSnippet(share.id)}</pre>
                                <button
                                    type="button"
                                    onClick={handleCopySnippet}
                                    className="self-start px-3 py-1 bg-[#703088] hover:bg-[#5d2670] text-white rounded text-sm"
                                >
                                    {snippetCopied ? '¡Código copiado!' : 'Copiar código'}
                                </button>
                                <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
                                    Para que este mapa no expire en tu sitio web, pide al administrador del IIEG que lo guarde
                                    dentro de tu llave desde el panel de administración.
                                </div>
                            </div>
                        )}
                    </>
                )}
                {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
                        <span className="flex-1">{error}</span>
                        <button
                            type="button"
                            onClick={() => setError(null)}
                            className="text-red-600 hover:text-red-800 font-bold cursor-pointer leading-none px-1"
                            aria-label="Cerrar mensaje de error"
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
