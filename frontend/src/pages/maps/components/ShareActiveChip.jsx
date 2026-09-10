import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import Tooltip from '@components/Tooltip';
import PillCloseButton from '@components/PillCloseButton';
import { fetchShare } from '@services/shareService';
import { useShareDeserializer } from '@pages/maps/hooks/useShareDeserializer';
import { trackShareMap } from '@services/analyticsService';

const SINCRONIZADO = 'bg-[#DCFCE7] text-[#16A34A] border-[#22C55E] hover:bg-[#BBF7D0]';
const MODIFICADO = 'bg-gray-100 text-gray-600 border-gray-400 hover:bg-gray-200';

const ShareActiveChip = ({ loadedShareId, isDirty = false, onRestaurado }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const deserialize = useShareDeserializer();
    const [restaurando, setRestaurando] = useState(false);

    const quitarEnlace = useCallback(() => {
        const siguiente = new URLSearchParams(searchParams);
        siguiente.delete('s');
        setSearchParams(siguiente, { replace: true });
    }, [searchParams, setSearchParams]);

    const restaurar = useCallback(async () => {
        if (!loadedShareId || restaurando) return;
        setRestaurando(true);
        try {
            const envelope = await fetchShare(loadedShareId).catch(() => null);
            if (!envelope) return;
            deserialize(envelope);
            onRestaurado?.();
            trackShareMap(isDirty ? 'share_revert' : 'share_reapply');
        } finally {
            setRestaurando(false);
        }
    }, [loadedShareId, restaurando, deserialize, onRestaurado, isDirty]);

    const etiqueta = isDirty ? 'Regresar a:' : 'Compartido:';
    const ayuda = isDirty
        ? `Volver al mapa del enlace ${loadedShareId}`
        : 'Recargar la configuración original del enlace compartido';

    return (
        <div className="group relative flex items-center mr-2">
            <Tooltip content={ayuda} placement="bottom" delay={300}>
                <button
                    type="button"
                    onClick={restaurar}
                    aria-busy={restaurando}
                    aria-label={`${etiqueta} ${loadedShareId}`}
                    className={`h-10 flex items-center px-4 rounded-full border shadow-[0_5px_20px_#1A26641A] text-[12px]/[16px] font-garet whitespace-nowrap cursor-pointer transition-colors ${isDirty ? MODIFICADO : SINCRONIZADO} ${restaurando ? 'opacity-60 cursor-wait' : ''}`}
                >
                    {etiqueta} <span className="font-bold tabular-nums ml-1">{loadedShareId}</span>
                </button>
            </Tooltip>
            <PillCloseButton
                onClick={quitarEnlace}
                tooltip="Quitar el enlace compartido"
                ariaLabel="Quitar enlace compartido"
                placement="left"
                className="absolute right-full pr-2 top-1/2 -translate-y-1/2"
            />
        </div>
    );
};

export default ShareActiveChip;
