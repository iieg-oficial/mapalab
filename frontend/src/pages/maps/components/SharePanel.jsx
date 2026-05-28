import { useState, useRef, useEffect } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import ScrollContainer from '@components/ScrollContainer';
import Checkbox from '@components/Checkbox';
import Badge from '@components/Badge';
import { HIDDEN_SCROLLBAR } from '@constants/global';
import { useShareSerializer } from '@pages/maps/hooks/useShareSerializer';
import { createShare, pinShare } from '@services/shareService';
import { trackShareMap } from '@services/analyticsService';
import { useMapsContext } from '@hooks/useMaps';

const IS_NON_PROD = ['dev', 'beta'].includes(import.meta.env.VITE_APP_ENV);

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

const SharePanel = ({ isDirty = false, loadedShareId = null, onShareCreated }) => {
    const serialize = useShareSerializer();
    const { compareMode, measurements } = useMapsContext();
    const [creating, setCreating] = useState(false);
    const [share, setShare] = useState(null);
    const [pinned, setPinned] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [tab, setTab] = useState('link');
    const [snippetCopied, setSnippetCopied] = useState(false);
    const [includeAnnotations, setIncludeAnnotations] = useState(true);
    const annotationsCount = Array.isArray(measurements)
        ? measurements.filter(m => m?.feature && m.type !== 'Select').length
        : 0;
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
            const extra = { includeAnnotations: includeAnnotations && annotationsCount > 0 };
            let envelope;
            if (compareMode?.active) {
                envelope = serialize('swipe', {
                    ...extra,
                    position: compareMode.swipePosition ?? 0.5,
                });
            } else {
                envelope = serialize('single', extra);
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

    const url = share ? buildShareUrl(share.id) : null;

    const tabButtonClass = (key) => `relative px-3 py-2 text-[13px]/[19px] font-garet border-b-2 -mb-px cursor-pointer transition-colors ${tab === key ? 'border-purple text-purple font-bold' : 'border-transparent text-graphite hover:text-purple'}`;

    const renderGenerateActions = (label) => (
        <>
            {annotationsCount > 0 && (
                <button
                    type="button"
                    onClick={() => setIncludeAnnotations(v => !v)}
                    className="w-full flex items-start gap-2 p-2 bg-white rounded-[7px] cursor-pointer text-left hover:bg-[#EAEFFA]/50 transition-colors"
                >
                    <Checkbox checked={includeAnnotations} onChange={() => setIncludeAnnotations(v => !v)} className="mt-1" />
                    <span className="flex-1 text-[11px]/[16px] font-garet text-graphite">
                        <span className="font-bold text-purple">Incluir mis mediciones y anotaciones ({annotationsCount}).</span>
                        <span className="block text-[10px]/[14px] text-gray-500 mt-0.5">
                            Quien abra el enlace verá las líneas, polígonos, textos y emojis dibujados.
                        </span>
                    </span>
                </button>
            )}
            <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="w-full h-10 bg-purple-deep text-white rounded-[30px] hover:bg-purple hover:shadow-[0_6px_6px_#5C247234] transition font-garet font-bold text-[13px] disabled:opacity-50 cursor-pointer"
            >
                {creating ? 'Generando…' : label}
            </button>
        </>
    );

    return (
        <div className={`pt-3 pb-6 px-4 w-full bg-[#F9FBFF] rounded-[14px] ${HIDDEN_SCROLLBAR}`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="block text-[18px]/[24px] font-garet font-bold text-purple tracking-normal">
                    Compartir mapa
                </h3>
                {loadedShareId && (
                    <span className="text-[10px] font-garet text-gray-400 tracking-normal tabular-nums">
                        ID: {loadedShareId}
                    </span>
                )}
            </div>

            {loadedShareId && !isDirty && !share && (
                <div className="mb-3 rounded-lg bg-[#DCFCE7] text-[#16A34A] border border-[#22C55E] px-3 py-2 text-[11px]/[16px] font-garet">
                    Estás viendo un mapa compartido. Genera uno nuevo si quieres una copia con los cambios.
                </div>
            )}
            {isDirty && !share && (
                <div className="mb-3 rounded-lg border border-orange/40 bg-[#FFF7EE] px-3 py-2 text-[11px]/[16px] font-garet text-[#7A4D00]">
                    <strong className="font-bold text-orange">Cambios sin guardar.</strong>{' '}
                    Modificaste capas, filtros o vista. Genera un enlace nuevo para conservar el mapa como está ahora.
                </div>
            )}

            {IS_NON_PROD && (
                <div role="tablist" aria-label="Modo de compartir" className="flex gap-1 border-b border-[#EAEFFA] mb-4">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'link'}
                        onClick={() => setTab('link')}
                        className={tabButtonClass('link')}
                    >
                        Enlace
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'embed'}
                        onClick={() => setTab('embed')}
                        className={tabButtonClass('embed')}
                    >
                        Insertar
                        <Badge variant="pill" color="orange" text="BETA" className="absolute -top-1 -right-2 text-[8px] px-1.5" />
                    </button>
                </div>
            )}

            {tab === 'link' && (
                <div className="flex flex-col gap-3">
                    <p className="text-[11px]/[16px] font-garet text-graphite">
                        Genera un enlace para compartir el mapa tal como lo estás viendo. Los enlaces se conservan 30 días desde el último uso; fíjalo para extenderlo a 1 año.
                    </p>

                    {!share && renderGenerateActions('Generar enlace')}

                    {share && url && (
                        <div className="bg-white rounded-[7px] p-3 flex flex-col gap-3">
                            <div className="relative h-10">
                                <input
                                    type="text"
                                    value={url}
                                    readOnly
                                    className="
                                        w-full h-full pl-3 pr-12 border-none bg-[#EAEFFA] rounded-lg
                                        text-[11px]/[16px] text-purple font-garet font-normal tracking-normal
                                        focus:outline-purple transition-colors
                                    "
                                />
                                <Tooltip content={copied ? '¡Enlace copiado!' : 'Copiar enlace'} placement="top" delay={300}>
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className={`absolute right-0 top-0 h-full w-10 rounded-r-lg flex items-center justify-center transition-colors cursor-pointer ${copied ? 'bg-[#16A34A]' : 'bg-purple-deep hover:bg-purple'}`}
                                        aria-label={copied ? 'Enlace copiado' : 'Copiar enlace'}
                                    >
                                        <Icon
                                            name={copied ? 'shared_click' : 'copie'}
                                            state="hover"
                                            className="size-4"
                                        />
                                    </button>
                                </Tooltip>
                            </div>

                            <button
                                type="button"
                                onClick={handlePin}
                                disabled={pinned}
                                className={`w-full h-10 rounded-[30px] font-garet font-bold text-[13px] transition cursor-pointer ${pinned ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#22C55E] cursor-default' : 'bg-orange text-white hover:bg-[#E07400] hover:shadow-[0_6px_6px_#FF830034]'}`}
                            >
                                {pinned ? 'Fijado por 1 año' : 'Fijar por 1 año'}
                            </button>
                            <p className="text-[10px]/[14px] font-garet text-gray-500 text-center">
                                {pinned
                                    ? 'Este enlace ya no se elimina de forma automática.'
                                    : 'Sin fijar, el enlace se borra si nadie lo usa durante 30 días.'}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {IS_NON_PROD && tab === 'embed' && (
                <div className="flex flex-col gap-3">
                    <p className="text-[11px]/[16px] font-garet text-graphite">
                        Inserta el mapa en otro sitio con un Web Component. Pega el código en tu HTML y reemplaza{' '}
                        <code className="px-1 py-0.5 bg-[#EAEFFA] text-purple rounded font-mono text-[10px]">mk_pub_TU_API_KEY</code>{' '}
                        por la llave que te entregó el equipo del IIEG.
                    </p>

                    {!share && renderGenerateActions('Generar código')}

                    {share && (
                        <div className="bg-white rounded-[7px] p-3 flex flex-col gap-3">
                            <p className="text-[10px]/[14px] font-garet text-gray-500">
                                Si aún no tienes llave, pídela con el código{' '}
                                <span className="font-mono font-bold text-purple">{share.id}</span>.
                            </p>
                            <ScrollContainer className="max-h-40">
                                <pre className="bg-graphite text-gray-100 text-[10px]/[14px] p-3 rounded-[7px] overflow-x-auto whitespace-pre font-mono">{buildEmbedSnippet(share.id)}</pre>
                            </ScrollContainer>
                            <button
                                type="button"
                                onClick={handleCopySnippet}
                                className="w-full h-10 bg-purple-deep text-white rounded-[30px] hover:bg-purple hover:shadow-[0_6px_6px_#5C247234] transition font-garet font-bold text-[13px] cursor-pointer"
                            >
                                {snippetCopied ? '¡Código copiado!' : 'Copiar código'}
                            </button>
                            <p className="text-[10px]/[14px] font-garet text-gray-500">
                                Para que el mapa no expire en tu sitio, pide al admin del IIEG que lo guarde dentro de tu llave.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-[11px]/[16px] font-garet text-red-700 flex items-start gap-2">
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
    );
};

export default SharePanel;
