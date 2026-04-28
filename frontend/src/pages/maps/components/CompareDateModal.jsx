import { useState, useEffect } from 'react';
import Modal from '@components/Modal';
import { useMapsContext } from '@hooks/useMaps';

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export default function CompareDateModal({ open, onClose, layout = 'split' }) {
    const { setCompareMode, filters, selectedLayerForSymbology } = useMapsContext();
    const [dateA, setDateA] = useState('');
    const [dateB, setDateB] = useState('');
    const [labelA, setLabelA] = useState('Antes');
    const [labelB, setLabelB] = useState('Despues');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open) return;
        const layerId = selectedLayerForSymbology?.id;
        const current = layerId ? filters?.[layerId]?.date : null;
        const match = typeof current === 'string' ? current.match(/(\d{4}-\d{2}-\d{2})/) : null;
        const initial = match ? match[1] : '';
        setDateA(initial);
        setDateB(initial);
        setError(null);
    }, [open, filters, selectedLayerForSymbology]);

    const handleConfirm = () => {
        if (!isValidDate(dateA) || !isValidDate(dateB)) {
            setError('Las fechas deben tener formato YYYY-MM-DD');
            return;
        }
        if (dateA === dateB) {
            setError('Las dos fechas deben ser distintas');
            return;
        }
        setCompareMode({
            active: true,
            axis: 'date',
            panes: [
                { value: dateA, label: labelA || dateA },
                { value: dateB, label: labelB || dateB },
            ],
            layout,
            swipePosition: 0.5,
        });
        onClose?.();
    };

    if (!open) return null;

    const title = layout === 'swipe' ? 'Comparador con barra divisora' : 'Comparar por fecha';
    const description = layout === 'swipe'
        ? 'Elige dos fechas. Veras el mapa con la barra divisora vertical: a la izquierda la primera fecha, a la derecha la segunda. Solo aplica a capas con dimension temporal.'
        : 'Elige dos fechas para comparar el estado del mapa lado a lado. Solo se aplicara a las capas con dimension temporal.';

    return (
        <Modal isOpen={open} onClose={onClose} title={title} width="max-w-md">
            <div className="flex flex-col gap-4 p-4">
                <p className="text-sm text-gray-700">{description}</p>
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-gray-600">Panel izquierdo</span>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={dateA}
                            onChange={(e) => setDateA(e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                            type="text"
                            placeholder="Etiqueta"
                            value={labelA}
                            onChange={(e) => setLabelA(e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-gray-600">Panel derecho</span>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={dateB}
                            onChange={(e) => setDateB(e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                            type="text"
                            placeholder="Etiqueta"
                            value={labelB}
                            onChange={(e) => setLabelB(e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                    </div>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                    >
                        Comparar
                    </button>
                </div>
            </div>
        </Modal>
    );
}
