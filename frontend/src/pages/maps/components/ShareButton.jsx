import { useState } from 'react';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import ShareModal from './ShareModal';
import { useShareDirtiness } from '@pages/maps/hooks/useShareDirtiness';

const ShareButton = () => {
    const [open, setOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const { isDirty, loadedShareId, reset } = useShareDirtiness();
    const inSyncWithShare = !!loadedShareId && !isDirty;
    const isModifiedFromShare = !!loadedShareId && isDirty;

    const tooltipText = inSyncWithShare
        ? `Estas viendo el enlace ${loadedShareId}. Click para crear uno nuevo.`
        : isModifiedFromShare
            ? 'Estado modificado. Click para crear un enlace nuevo.'
            : 'Compartir mapa';

    return (
        <>
            <Tooltip content={tooltipText} placement="bottom" delay={300}>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className={`cursor-pointer rounded-full size-12.5 flex items-center justify-center transition-colors ${
                        inSyncWithShare
                            ? 'bg-[#DCFCE7] border border-[#22C55E] text-[#16A34A]'
                            : isModifiedFromShare
                                ? 'bg-gray-100 border border-gray-400 text-gray-600 hover:bg-gray-200'
                                : isHovered
                                    ? 'bg-[#703088]'
                                    : 'bg-[#F7F0FA]'
                    }`}
                    aria-label={tooltipText}
                >
                    {inSyncWithShare ? (
                        <Icon name="done" className="size-6" />
                    ) : (
                        <Icon
                            name="copie"
                            state={isHovered && !isModifiedFromShare ? 'hover' : 'normal'}
                            className="size-6"
                        />
                    )}
                </button>
            </Tooltip>
            <ShareModal
                open={open}
                onClose={() => setOpen(false)}
                isDirty={isDirty}
                loadedShareId={loadedShareId}
                onShareCreated={reset}
            />
        </>
    );
};

export default ShareButton;
