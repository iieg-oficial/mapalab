import { useEffect, useRef } from 'react';
import Panel from '@components/Panel';
import RotationControls from './RotationControls';

const TextPanel = ({
    open,
    anchorRef,
    value,
    onChange,
    onSave,
    onClose,
    rotation,
    onRotationChange
}) => {
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) {
            inputRef.current?.focus();
        }
    }, [open]);

    const hasContent = Boolean(value?.trim());

    const footer = (
        <div className="flex gap-2">
            <button
                type="button"
                onClick={() => hasContent && onSave?.()}
                disabled={!hasContent}
                className={[
                    'flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
                    hasContent
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                ].join(' ')}
            >
                Guardar
            </button>
            <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800  "
            >
                Cerrar
            </button>
        </div>
    );

    return (
        <Panel
            open={open}
            anchorRef={anchorRef}
            onClose={onClose}
            title="Texto a colocar"
            width="w-64"
            footer={footer}
            shadow="shadow-[0_5px_20px_#1A26641A]"
        >
            <div className="p-3 space-y-3">
                <input
                    ref={inputRef}
                    value={value}
                    onChange={(event) => onChange?.(event.target.value)}
                    placeholder="Escribe el texto a colocar"
                    className="w-full rounded-lg border border-gray-200  bg-transparent px-2 py-1.5 text-sm text-gray-700  focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <RotationControls rotation={rotation} onChange={onRotationChange} />
            </div>
        </Panel>
    );
};

export default TextPanel;
