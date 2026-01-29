import Panel from '@components/Panel';
import RotationControls from './RotationControls';

const EMOJI_TABLE = [
    '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','🥰','😗','😙','😚',
    '🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱',
    '😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟',
    '😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠',
    '🤬','😷','🤒','🤕','🤢','🤮','🤧','😇','🥳','🥸','🤠','🤡','🤥','🤫','🤭','🧐','🤓','😈'
];

const EmojiPanel = ({ open, anchorRef, onSelect, onClose, rotation, onRotationChange }) => {
    const footer = (
        <RotationControls showTitle={false} rotation={rotation} onChange={onRotationChange} />
    );

    return (
        <Panel
            open={open}
            anchorRef={anchorRef}
            onClose={onClose}
            title="Emojis"
            width="w-52"
            maxHeight="max-h-80"
            footer={footer}
        >
            <div className="p-3">
                <div className="grid grid-cols-6 gap-1">
                    {EMOJI_TABLE.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => onSelect?.(emoji)}
                            className="text-lg hover:bg-black/5  rounded-lg p-1 transition"
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
