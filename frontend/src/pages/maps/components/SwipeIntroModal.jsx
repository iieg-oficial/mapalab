import { useState } from 'react';
import Modal from '@components/Modal';
import Checkbox from '@components/Checkbox';
import { SWIPE_INTRO_DISMISSED_KEY } from '@pages/maps/helpers/swipeIntroStorage';

const SwipeIntroModal = ({ open, onCancel, onConfirm }) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    if (!open) return null;

    const handleConfirm = () => {
        if (dontShowAgain) {
            try { localStorage.setItem(SWIPE_INTRO_DISMISSED_KEY, 'true'); } catch { /* storage no disponible */ }
        }
        onConfirm?.();
    };

    return (
        <Modal isOpen={open} onClose={onCancel} title="Comparador con barra divisora" width="max-w-md">
            <div className="flex flex-col gap-4 p-4">
                <p className="text-sm text-gray-700">
                    El comparador empieza con los dos slots <span className="font-bold">vacios</span>. Tus capas actuales quedan guardadas y volveran al cerrar.
                </p>
                <p className="text-sm text-gray-700">
                    Agrega capas en cada slot (A o B) para compararlas lado a lado. Para mejor rendimiento conviene agregar las capas <span className="font-bold">una por una</span>.
                </p>
                <p className="text-sm text-gray-700">
                    Al cerrar el comparador (X) volveras a tus capas originales.
                </p>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 mt-2">
                    <Checkbox checked={dontShowAgain} onChange={() => setDontShowAgain(prev => !prev)} />
                    No volver a mostrar este aviso
                </label>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-[#703089] hover:bg-[#5C2472] text-white rounded text-sm cursor-pointer"
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SwipeIntroModal;
