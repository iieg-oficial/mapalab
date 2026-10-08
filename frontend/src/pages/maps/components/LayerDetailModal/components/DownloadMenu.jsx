import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFloatingPosition } from '@hooks/useFloatingPosition';
import Checkbox from '@components/Checkbox';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { VECTOR_FORMATS, RASTER_FORMATS } from '@services/downloadService';

const DATA_OPTIONS = [
    { id: 'active', label: 'Fecha activa' },
    { id: 'all', label: 'Todas las fechas' },
];

const DownloadMenu = ({
    open,
    anchorRef,
    onClose,
    isRaster,
    hasDateFilter,
    availableMetadata,
    onDownload,
}) => {
    const formats = isRaster ? RASTER_FORMATS : VECTOR_FORMATS;
    const [selectedFormat, setSelectedFormat] = useState(formats[0]?.id);
    const [dateMode, setDateMode] = useState('all');
    const [metaTxt, setMetaTxt] = useState(false);
    const [metaXlsx, setMetaXlsx] = useState(false);
    const panelRef = useRef(null);

    useEffect(() => {
        setSelectedFormat(formats[0]?.id);
    }, [isRaster, formats]);

    useFloatingPosition({
        open,
        anchorRef,
        contentRef: panelRef,
        placement: 'bottom-end',
        offset: 4,
    });

    useEffect(() => {
        if (!open || !onClose) return;
        const handleClickOutside = (e) => {
            if (
                panelRef.current && !panelRef.current.contains(e.target) &&
                anchorRef?.current && !anchorRef.current.contains(e.target)
            ) {
                onClose();
            }
        };
        const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open, onClose, anchorRef]);

    const handleDownload = () => {
        onDownload({
            formatId: selectedFormat,
            dateMode,
            metadataSelections: { txt: metaTxt, xlsx: metaXlsx },
        });
    };

    if (!open) return null;

    return createPortal(
        <div
            ref={panelRef}
            className="fixed z-50 w-80 bg-white rounded-[14px] shadow-2xl overflow-hidden flex flex-col"
        >
            <div className="sticky top-0 bg-white px-3 flex items-center justify-between rounded-t-2xl shrink-0">
                <span className="font-garet font-bold text-[14px]/[47px]">Descargar capa</span>
                <Tooltip content="Cerrar" placement="left" delay={400}>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <Icon name="close" />
                    </button>
                </Tooltip>
            </div>

            <div className="flex-1 overflow-y-auto px-4 scrollbar-thin scrollbar-thumb-gray-400">
                <div className="flex flex-col gap-4">
                    <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Formato
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {formats.map(fmt => (
                                <button
                                    key={fmt.id}
                                    onClick={() => setSelectedFormat(fmt.id)}
                                    className={`
                                        px-3 py-1.5 text-sm rounded-[14px] border transition-colors
                                    ${selectedFormat === fmt.id
                                    ? 'bg-[#FF8300] border-transparent text-white font-medium'
                                    : 'border-[#703089] text-[#703089] hover:bg-[#703089] hover:text-white'
                                }
                                    `}
                                >
                                    {fmt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {!isRaster && (
                        <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Datos
                            </div>
                            <div className="flex gap-2">
                                {DATA_OPTIONS.map(opt => {
                                    const isDisabled = opt.id === 'active' && !hasDateFilter;
                                    const isSelected = dateMode === opt.id && !isDisabled;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => !isDisabled && setDateMode(opt.id)}
                                            disabled={isDisabled}
                                            className={`
                                                px-3 py-1.5 text-sm rounded-[14px] border transition-colors
                                            ${isDisabled
                                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                            : isSelected
                                                ? 'bg-[#FF8300] border-transparent text-white font-medium'
                                                : 'border-[#703089] text-[#703089] hover:bg-[#703089] hover:text-white'
                                        }
                                            `}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {(availableMetadata.hasTxt || availableMetadata.hasXlsx) && (
                        <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Metadatos
                            </div>
                            <div className="flex flex-col gap-1.5">
                                {availableMetadata.hasTxt && (
                                    <label className="flex items-center gap-1 text-sm text-[#465055] cursor-pointer">
                                        <Checkbox checked={metaTxt} onChange={() => setMetaTxt(v => !v)} />
                                        TXT
                                    </label>
                                )}
                                {availableMetadata.hasXlsx && (
                                    <label className="flex items-center gap-1 text-sm text-[#465055] cursor-pointer">
                                        <Checkbox checked={metaXlsx} onChange={() => setMetaXlsx(v => !v)} />
                                        XLSX
                                    </label>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="sticky bottom-0 bg-white p-3 rounded-b-2xl shrink-0">
                <button
                    onClick={handleDownload}
                    className="w-full p-3 bg-[#703089] text-white rounded-[30px] hover:bg-[#5C2472] hover:shadow-[0_6px_6px_#5C247234] transition font-garet font-bold text-[14px]"
                >
                    Descargar {formats.find(f => f.id === selectedFormat)?.label}
                </button>
            </div>
        </div>,
        document.body
    );
};

export default DownloadMenu;
