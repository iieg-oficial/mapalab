import { useState } from 'react';
import Panel from '@components/Panel';
import RotationControls from './RotationControls';
import { emojiCatalog } from '@pages/maps/helpers/emojiCatalog';

const EmojiPanel = ({ open, anchorRef, onSelect, onClose, rotation, onRotationChange }) => {
    const [activeCategory, setActiveCategory] = useState(0);

    const footer = (
        <RotationControls showTitle={false} rotation={rotation} onChange={onRotationChange} />
    );

    return (
        <Panel
            open={open}
            anchorRef={anchorRef}
            onClose={onClose}
            title="Emojis"
            width="w-[334px]"
            maxHeight="max-h-96"
            offset={4}
            className="z-20"
            footer={footer}
        >
            <div className="flex border-b border-gray-100 px-1 pt-1 gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {emojiCatalog.map((cat, idx) => (
                    <button
                        key={cat.name}
                        onClick={() => setActiveCategory(idx)}
                        className={`p-1.5 text-base rounded-t-lg shrink-0 transition-colors ${activeCategory === idx ? 'bg-[#F3EBFF]' : 'hover:bg-gray-50'}`}
                        title={cat.name}
                    >
                        {cat.icon}
                    </button>
                ))}
            </div>
            <div className="p-2 overflow-y-auto max-h-56">
                <div className="grid grid-cols-7 gap-0.5">
                    {emojiCatalog[activeCategory].emojis.map((emoji, idx) => (
                        <button
                            key={`${activeCategory}-${idx}`}
                            type="button"
                            onClick={() => onSelect?.(emoji)}
                            className="text-lg hover:bg-black/5 rounded-lg p-1 transition"
                            aria-label={`Insertar ${emoji}`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </Panel>
    );
};

export default EmojiPanel;
