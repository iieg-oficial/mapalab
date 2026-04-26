import { useState } from 'react';
import Modal from '@components/Modal';
import { useShareSerializer } from '@pages/maps/hooks/useShareSerializer';
import { createShare, pinShare } from '@services/shareService';
import { trackShareMap } from '@services/analyticsService';
import CompareButton from './CompareButton';

const buildShareUrl = (id) => {
    const base = window.location.origin;
    const path = (import.meta.env.VITE_BASE_PATH || '/').replace(/\/?$/, '/');
    return `${base}${path}mapa?s=${encodeURIComponent(id)}`;
};

export default function ShareModal({ open, onClose }) {
    const serialize = useShareSerializer();
    const [creating, setCreating] = useState(false);
    const [share, setShare] = useState(null);
    const [pinned, setPinned] = useState(false);
    const [error, setError] = useState(null);

    const handleCreate = async () => {
        setCreating(true);
        setError(null);
        setPinned(false);
        try {
            const envelope = serialize('single');
            const result = await createShare(envelope);
            setShare(result);
            trackShareMap('share_create');
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
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={url}
                                readOnly
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                            />
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                            >
                                Copiar
                            </button>
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

                <hr className="border-gray-200" />
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-700">Comparador por fecha (proximamente):</p>
                    <CompareButton disabled />
                </div>
            </div>
        </Modal>
    );
}
