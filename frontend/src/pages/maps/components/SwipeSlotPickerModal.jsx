import Modal from '@components/Modal';
import { useMapsContext } from '@hooks/useMaps';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';

const SwipeSlotPickerModal = () => {
    const { pendingSlotPick, confirmPendingSlot, cancelPendingSlot, allLayers } = useMapsContext();

    if (!pendingSlotPick) return null;

    const layer = findLayerDef(pendingSlotPick.layerId, allLayers);
    const layerName = layer?.label || layer?.name || pendingSlotPick.layerId;

    const slotButton = (target, label, color, hoverColor) => (
        <button
            type="button"
            onClick={() => confirmPendingSlot(target)}
            className={`flex-1 px-4 py-3 rounded text-sm font-garet font-bold text-white transition-colors cursor-pointer ${color} ${hoverColor}`}
        >
            {label}
        </button>
    );

    return (
        <Modal isOpen={true} onClose={cancelPendingSlot} title="Agregar capa al comparador" width="max-w-md">
            <div className="flex flex-col gap-4 p-4">
                <p className="text-sm text-gray-700">
                    En que slot quieres agregar <span className="font-bold">{layerName}</span>?
                </p>
                <div className="flex gap-2">
                    {slotButton('A', 'Solo A', 'bg-[#5C2472]', 'hover:bg-[#4A1D60]')}
                    {slotButton('B', 'Solo B', 'bg-[#FF8300]', 'hover:bg-[#E07300]')}
                    {slotButton('AB', 'Ambos', 'bg-[#703089]', 'hover:bg-[#5C2472]')}
                </div>
                <button
                    type="button"
                    onClick={cancelPendingSlot}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm self-end cursor-pointer"
                >
                    Cancelar
                </button>
            </div>
        </Modal>
    );
};

export default SwipeSlotPickerModal;
