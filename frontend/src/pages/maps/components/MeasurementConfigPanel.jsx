import { useEffect, useRef, useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useFloatingPosition } from '@hooks/useFloatingPosition';
import ConfirmModal from '@components/ConfirmModal';

const MeasurementConfigPanel = ({ open, anchorRef, config, onConfigChange, onClose }) => {
    const panelRef = useRef(null);
    const [confirmModal, setConfirmModal] = useState({ open: false, key: null });

    useFloatingPosition({
        open,
        anchorRef,
        contentRef: panelRef,
        placement: 'right-start',
        offset: 12
    });

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (event) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(event.target) &&
                anchorRef?.current &&
                !anchorRef.current.contains(event.target) &&
                !document.getElementById('measurement-confirm-modal')?.contains(event.target)
            ) {
                onClose?.();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, onClose, anchorRef]);

    if (!open) return null;

    const handleToggle = (key) => {
        if ((key === 'showFinalAngles' || key === 'showMeasurementLabels') && config[key]) {
            setConfirmModal({ open: true, key });
            return;
        }

        onConfigChange?.({
            ...config,
            [key]: !config[key]
        });
    };

    const handleConfirmToggle = () => {
        if (confirmModal.key) {
            onConfigChange?.({
                ...config,
                [confirmModal.key]: !config[confirmModal.key]
            });
        }
        setConfirmModal({ open: false, key: null });
    };

    return (
        <>
            <div
                ref={panelRef}
                className="fixed z-30 w-64 rounded-2xl border border-black/10  bg-white  shadow-2xl"
            >
                <div className="p-3 border-b border-black/10  flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600 ">
                        Configuración de medición
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 "
                        aria-label="Cerrar configuración"
                    >
                        <Icon name="close" />
                    </button>
                </div>
                <div className="p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 cursor-pointer group flex-1">
                            <span className="text-sm text-gray-700  group-hover:text-gray-900 ">
                                Ángulos en tiempo real
                            </span>
                            <Tooltip content="Esta opción puede afectar el rendimiento durante el dibujo de geometrías complejas" placement="top" delay={300}>
                                <div className="flex items-center text-yellow-600 ">
                                    <Icon name="info" />
                                </div>
                            </Tooltip>
                        </label>
                        <input
                            type="checkbox"
                            checked={config.showLiveAngles}
                            onChange={() => handleToggle('showLiveAngles')}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                    </div>

                    <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm text-gray-700  group-hover:text-gray-900 ">
                            Ángulos finales
                        </span>
                        <input
                            type="checkbox"
                            checked={config.showFinalAngles}
                            onChange={() => handleToggle('showFinalAngles')}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm text-gray-700  group-hover:text-gray-900 ">
                            Etiquetas de medición
                        </span>
                        <input
                            type="checkbox"
                            checked={config.showMeasurementLabels}
                            onChange={() => handleToggle('showMeasurementLabels')}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                    </label>

                    <div>
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm text-gray-700  group-hover:text-gray-900 ">
                                Herramientas de anotación
                            </span>
                            <input
                                type="checkbox"
                                checked={config.enableAnnotationTools}
                                onChange={() => handleToggle('enableAnnotationTools')}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                        </label>
                        <p className="text-xs text-gray-500  mt-1">
                            Trazo libre, Texto y Emoji
                        </p>
                    </div>
                </div>
            </div>

            <div id="measurement-confirm-modal">
                <ConfirmModal
                    open={confirmModal.open}
                    anchorRef={panelRef}
                    onClose={() => setConfirmModal({ open: false, key: null })}
                    onConfirm={handleConfirmToggle}
                    title="Confirmar cambio"
                    confirmText="Continuar"
                >
                    <p>
                        Al desactivar esta opción, las mediciones existentes se actualizarán. ¿Deseas continuar?
                    </p>
                    <p className="text-xs text-gray-500 ">
                        Si prefieres, puedes limpiar todas las mediciones antes de cambiar esta configuración.
                    </p>
                </ConfirmModal>
            </div>
        </>
    );
};

export default MeasurementConfigPanel;
