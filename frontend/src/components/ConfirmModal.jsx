import Panel from '@components/Panel';

const ConfirmModal = ({
    open,
    anchorRef,
    onClose,
    onConfirm,
    title,
    children,
    confirmText = 'Confirmar',
    confirmButtonClass = 'bg-red-500 hover:bg-red-600'
}) => {
    return (
        <Panel
            open={open}
            anchorRef={anchorRef}
            onClose={onClose}
            title={title}
            footer={(
                <div className="flex items-center gap-2 w-full px-1">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white transition ${confirmButtonClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            )}
        >
            <div className="p-3 text-sm text-gray-600 space-y-2">
                {children}
            </div>
        </Panel>
    );
};

export default ConfirmModal;
