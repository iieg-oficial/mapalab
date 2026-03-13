import { useState, useEffect } from 'react';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import handleShare from '../helpers/handleShare';
import { trackShareMap } from '@services/analyticsService';

const ShareButton = () => {
    const [shareMessage, setShareMessage] = useState(null);
    const isCopied = shareMessage === '¡Enlace copiado!'

    useEffect(() => {
        if (shareMessage) {
            trackShareMap(isCopied ? 'exito' : 'error');
            const timer = setTimeout(() => {
                setShareMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shareMessage]);

    return (
        <Tooltip
            content={shareMessage || 'Compartir mapa'}
            placement="bottom"
            delay={300}
            forceVisible={!!shareMessage}
        >
            <button
                type="button"
                onClick={() => handleShare(setShareMessage)}
                className={`cursor-pointer h-auto bg-[#F7F0FA] border hover:border-[#703088] ${isCopied ? 'border-[#703088]' : 'border-transparent'} rounded-full p-3`}
                aria-label="Compartir mapa"
            >
                <Icon
                    name={isCopied ? 'shared_click' : 'copie'}
                    state={isCopied ? 'hover' : 'normal'}
                    className={'size-6.5'}
                />
            </button>
        </Tooltip>
    );
};

export default ShareButton;

