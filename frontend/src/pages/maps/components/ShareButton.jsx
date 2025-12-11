import { useState, useEffect } from 'react';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import handleShare from '../helpers/handleShare';

const ShareButton = () => {
    const [shareMessage, setShareMessage] = useState(null);

    useEffect(() => {
        if (shareMessage) {
            const timer = setTimeout(() => {
                setShareMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [shareMessage]);

    return (
        <Tooltip
            content={shareMessage || 'Compartir mapa'}
            placement="left"
            delay={300}
        >
            <button
                type="button"
                onClick={() => handleShare(setShareMessage)}
                className={[
                    'flex items-center justify-center rounded-lg p-2 text-sm transition',
                    shareMessage === '¡Enlace copiado!'
                        ? 'bg-green-500 text-white'
                        : 'bg-black/5 text-black/70 hover:bg-black/10'
                ].join(' ')}
                aria-label="Compartir mapa"
            >
                <Icon name="share" />
            </button>
        </Tooltip>
    );
};

export default ShareButton;
