import { useState } from 'react';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import ShareModal from './ShareModal';

const ShareButton = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Tooltip content="Compartir mapa" placement="bottom" delay={300}>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="cursor-pointer h-auto bg-[#F7F0FA] border border-transparent hover:border-[#703088] rounded-full p-3"
                    aria-label="Compartir mapa"
                >
                    <Icon name="copie" state="normal" className="size-6.5" />
                </button>
            </Tooltip>
            <ShareModal open={open} onClose={() => setOpen(false)} />
        </>
    );
};

export default ShareButton;
