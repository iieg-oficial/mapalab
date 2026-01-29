import { useState, useContext, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import MapsContext from '@contexts/MapsContext';
import { DOWNLOAD_FORMATS, downloadLayer } from '@services/downloadService';
import Icon from '@components/Icon';
import Divider from '@components/Divider';
import Alert from '@components/Alert';

const LayerDownloadModal = ({ layerId, layerName, onClose }) => {
    const { getFilter, activeLayerIds } = useContext(MapsContext);
    const modalRef = useRef(null);
    const [selectedFormat, setSelectedFormat] = useState(DOWNLOAD_FORMATS.SHAPEFILE);
    const [downloadComplete, setDownloadComplete] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState(null);

    const enabledFormats = Object.values(DOWNLOAD_FORMATS).filter(f => f.enabled);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const handleBackdropClick = (event) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        setError(null);
        try {
            const result = await downloadLayer(layerId, selectedFormat, {
                applyFilters: !downloadComplete,
                getFilter: downloadComplete ? null : getFilter,
                activeLayerIds
            });

            if (result.success) {
                onClose();
            } else {
                setError(result.error || 'Error desconocido al descargar la capa');
            }
        } catch (error) {
            setError(error.message || 'Error inesperado al descargar');
        } finally {
            setDownloading(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="w-96 max-h-[80vh] rounded-2xl border border-black/10 bg-white shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white p-3 flex items-center justify-between rounded-t-2xl shrink-0">
                    <div>
                        <span className="text-xs font-semibold text-gray-600">
                            Descargar capa
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                            {layerName}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800"
                        aria-label="Cerrar modal"
                    >
                        <Icon name="close" />
                    </button>
                </div>

                <Divider spacingClass="my-0" />

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
                    <div className="space-y-4">
                        {error && (
                            <Alert
                                severity="error"
                                title="Error en la descarga"
                                message={error}
                                onClose={() => setError(null)}
                            />
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Formato de descarga:
                            </label>
                            <div className="space-y-2">
                                {enabledFormats.map((format) => (
                                    <label
                                        key={format.id}
                                        className="flex items-center p-3 border border-black/10 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        <input
                                            type="radio"
                                            name="format"
                                            value={format.id}
                                            checked={selectedFormat.id === format.id}
                                            onChange={() => setSelectedFormat(format)}
                                            className="mr-3"
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">
                                                {format.label}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                .{format.extension}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="flex items-start cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={downloadComplete}
                                    onChange={(e) => setDownloadComplete(e.target.checked)}
                                    className="mt-1 mr-3"
                                />
                                <div>
                                    <div className="text-sm font-medium text-gray-700">
                                        Descargar capa completa (sin filtros)
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Incluye todos los registros sin aplicar filtros de fecha o subcapas
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <Divider spacingClass="my-0" />

                <div className="sticky bottom-0 bg-white p-3 rounded-b-2xl shrink-0">
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-black/10 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                            disabled={downloading}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                        >
                            {downloading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Descargando...
                                </>
                            ) : (
                                <>
                                    <Icon name="download" className="w-4 h-4" />
                                    Descargar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LayerDownloadModal;
