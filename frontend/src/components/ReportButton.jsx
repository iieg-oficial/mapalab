import { useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import ReportModal from '@components/ReportModal';

const ReportButton = ({ variant = 'floating', extraContext, captureFn, label = 'Reportar', className = '' }) => {
    const [open, setOpen] = useState(false);

    if (variant === 'inline') {
        return (
            <>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className={`inline-flex items-center gap-1.5 text-sm font-medium text-[#5C2472] hover:text-[#4a1d5c] hover:underline ${className}`}
                >
                    <Icon name="bug" className="w-4 h-4" />
                    <span>{label}</span>
                </button>
                {open && (
                    <ReportModal
                        isOpen={open}
                        onClose={() => setOpen(false)}
                        extraContext={extraContext}
                        captureFn={captureFn}
                    />
                )}
            </>
        );
    }

    return (
        <>
            <Tooltip content={label} placement="left" delay={400}>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label={label}
                    className={`w-7 h-7 md:w-6 md:h-6 rounded-full bg-white flex items-center justify-center text-[#6E7477] hover:text-[#5C2472] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)] transition-colors ${className}`}
                >
                    <Icon name="bug" className="w-4 h-4" />
                </button>
            </Tooltip>
            {open && (
                <ReportModal
                    isOpen={open}
                    onClose={() => setOpen(false)}
                    extraContext={extraContext}
                    captureFn={captureFn}
                />
            )}
        </>
    );
};

export default ReportButton;
