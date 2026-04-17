import { useEffect, useRef } from 'react';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import { useOutsideClick } from '@hooks/useOutsideClick';
import Icon from '@components/Icon';
import Badge from '@components/Badge';

const TextPanel = ({
    open,
    anchorRef,
    value,
    onChange,
    onSave,
    onClose,
    placedCount = 0
}) => {
    const inputRef = useRef(null);
    const panelRef = useRef(null);
    const { className: positionClass } = useSiderAdaptivePosition({ anchorRef: 'textPanel' });

    const hasContent = Boolean(value?.trim());

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    useOutsideClick(
        anchorRef ? [panelRef, anchorRef] : [panelRef],
        () => { if (open) onClose?.(); }
    );

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.();
            if (e.key === 'Enter' && hasContent) onSave?.();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose, onSave, hasContent]);

    return (
        <div
            ref={panelRef}
            className={`
                fixed z-10 flex-col gap-2 ml-15 items-start w-[334px] max-md:max-w-[calc(100vw-5rem)] px-3 pb-3
                border border-transparent bg-[#F9FBFF] rounded-[12px] shadow-none
                ${open ? 'flex' : 'hidden'} ${positionClass}
            `}
        >
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-5 font-garet font-bold text-[14px]/[47px] text-[#465055]">
                    Texto
                    <Badge visible={placedCount > 0} count={placedCount} />
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="cursor-pointer"
                    aria-label="Cerrar panel de texto"
                >
                    <Icon name="cerrarModal" className="size-7" />
                </button>
            </div>

            <div className="w-full rounded-[7px] bg-white p-3">
                <input
                    ref={inputRef}
                    value={value}
                    onChange={(event) => onChange?.(event.target.value)}
                    placeholder="Escribe el texto a colocar"
                    className="w-full rounded-lg border border-[#E6E9F0] bg-transparent px-3 py-2 font-garet font-medium text-[13px] text-[#465055] placeholder:text-[#8A9199] focus:outline-none focus:border-[#70308A] transition-colors"
                />
            </div>

            <button
                type="button"
                onClick={() => hasContent && onSave?.()}
                disabled={!hasContent}
                className={`
                    w-full py-2 px-4 rounded-[30px] font-garet font-bold text-[13px] transition-all
                    ${hasContent
            ? 'bg-[#703089] text-white hover:bg-[#5C2472] hover:shadow-[0_6px_6px_#5C247234] cursor-pointer'
            : 'bg-[#E6E9F0] text-[#8A9199] cursor-not-allowed'}
                `}
            >
                Colocar texto
            </button>
        </div>
    );
};

export default TextPanel;
