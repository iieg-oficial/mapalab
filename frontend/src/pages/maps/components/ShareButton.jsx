import { useRef, useState } from 'react';
import Panel from '@components/Panel';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import SharePanel from './SharePanel';
import { useShareDirtiness } from '@pages/maps/hooks/useShareDirtiness';

const ShareButton = ({ onOpenChange }) => {
    const [open, setOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const anchorRef = useRef(null);
    const { isDirty, loadedShareId, reset } = useShareDirtiness();
    const inSyncWithShare = !!loadedShareId && !isDirty;
    const isModifiedFromShare = !!loadedShareId && isDirty;

    const handleSetOpen = (next) => {
        setOpen(next);
        onOpenChange?.(next);
    };

    const tooltipText = inSyncWithShare
        ? `Estás viendo el enlace ${loadedShareId}. Click para crear uno nuevo.`
        : isModifiedFromShare
            ? 'Estado modificado. Click para crear un enlace nuevo.'
            : 'Compartir mapa';

    const buttonClass = inSyncWithShare
        ? 'bg-[#DCFCE7] border border-[#22C55E] text-[#16A34A] hover:bg-[#BBF7D0]'
        : isModifiedFromShare
            ? 'bg-gray-100 border border-gray-400 text-gray-600 hover:bg-gray-200'
            : isHovered
                ? 'bg-purple-deep'
                : 'bg-purple-soft hover:shadow-[0_6px_6px_#5C247234]';

    return (
        <div className="flex flex-col relative">
            <Tooltip content={tooltipText} placement="bottom" delay={300}>
                <button
                    ref={anchorRef}
                    type="button"
                    onClick={() => handleSetOpen(!open)}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className={`cursor-pointer rounded-full size-12.5 flex items-center justify-center transition-colors ${buttonClass}`}
                    aria-label={tooltipText}
                    aria-expanded={open}
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
