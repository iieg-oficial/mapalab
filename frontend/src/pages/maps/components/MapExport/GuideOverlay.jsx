import { createPortal } from 'react-dom';
import Icon from '@components/Icon';

const GuideOverlay = ({ visible, aspectRatio = 1.2, onConfirm, onCancel }) => {
    if (!visible) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] pointer-events-none flex items-center justify-center cursor-move"
            style={{ zIndex: 99999 }}
        >
            <div
                id="export-guide-frame"
                className="relative box-content shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out pointer-events-none"
                style={{
                    aspectRatio: aspectRatio,
                    width: `min(80vw, calc(80vh * ${aspectRatio}))`,
                }}
            >
                <div className="absolute top-0 left-0 bg-[#703089] text-white text-[10px] px-2 py-1 font-bold rounded-br uppercase tracking-wide">
                    Área de Exportación
                </div>

                <div className="absolute top-1/2 left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 opacity-70 pointer-events-none">
                    <div className="absolute top-1/2 w-full h-[4px] bg-gray-900 rounded-full shadow-sm -translate-y-1/2"></div>
                    <div className="absolute left-1/2 h-full w-[4px] bg-gray-900 rounded-full shadow-sm -translate-x-1/2"></div>
                </div>

                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto">
                    <button
                        onClick={onCancel}
                        className="flex items-center gap-2 px-6 py-2 bg-white text-gray-700 rounded-full shadow-lg hover:bg-gray-50 transition-all font-bold text-sm cursor-pointer"
                    >
                        <Icon name="close" className="w-4 h-4" />
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex items-center gap-2 px-6 py-2 bg-[#703089] text-white rounded-full shadow-lg hover:bg-[#5C2472] transition-all font-bold text-sm cursor-pointer"
                    >
                        <Icon name="check" className="w-4 h-4" />
                        Capturar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default GuideOverlay;
