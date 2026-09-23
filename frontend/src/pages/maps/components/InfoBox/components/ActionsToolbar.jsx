import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';

const formatCount = (n) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`.replace('.0k', 'k');
    return String(n);
};

const ActionsToolbar = ({
    onClear,
    onDownload,
    onDownloadMap = null,
    onCenter,
    onEdit = null,
    moveHandleProps = null,
    isMoving = false,
    visible = true,
    downloadCount = null,
    downloadShowsPlus = false,
    downloadTooltip = 'Descargar información',
    downloadMapTooltip = 'Descargar la imagen del mapa recortada a esta selección',
    centerTooltip = 'Centrar selección en el mapa',
    moveTooltip = 'Arrastrar para mover esta tarjeta',
    editTooltip = 'Personalizar esta tarjeta',
}) => {
    if (!visible) return null;

    const hasAction = onClear || onDownload || onDownloadMap || onCenter || onEdit || moveHandleProps;
    if (!hasAction) return null;

    return (
        <div className="flex flex-col gap-1.5">
            {onClear && (
                <Tooltip content="Cerrar todas las tarjetas" placement="left" delay={300}>
                    <button
                        type="button"
                        onClick={onClear}
                        className="bg-[#FFE6EC] text-[#703089] hover:border-[#FF577D] flex items-center justify-center p-1 rounded-full border border-transparent transition-all shadow-[0px_6px_12px_#2F495C14]"
                    >
                        <Icon name="cerrar" className="size-5" />
                    </button>
                </Tooltip>
            )}

            {moveHandleProps && (
                <Tooltip content={moveTooltip} placement="left" delay={300}>
                    <button
                        type="button"
                        {...moveHandleProps}
                        className={`flex items-center justify-center p-1 rounded-full border border-transparent transition-all bg-[#EAEFFA] text-[#703089] hover:border-purple shadow-[0px_6px_12px_#2F495C14] ${isMoving ? 'cursor-grabbing' : 'cursor-grab'}`}
                        style={{ touchAction: 'none' }}
                    >
                        <Icon name="move_arrows" className="size-5" />
                    </button>
                </Tooltip>
            )}

            {onDownload && (
                <Tooltip content={downloadTooltip} placement="left" delay={300}>
                    <button
                        type="button"
                        onClick={onDownload}
                        className="relative flex items-center justify-center p-1 rounded-full border border-transparent transition-all bg-[#EAEFFA] text-[#703089] hover:border-purple shadow-[0px_6px_12px_#2F495C14]"
                    >
                        <Icon name="download" className="size-5" />
                        {downloadCount != null && downloadCount > 0 && (
                            <span className="absolute -bottom-1.5 -right-3 min-w-4.5 h-4.5 px-1 inline-flex items-center justify-center rounded-full bg-orange text-white text-[10px]/[12px] font-bold tabular-nums shadow-sm">
                                {formatCount(downloadCount)}{downloadShowsPlus ? '+' : ''}
                            </span>
                        )}
                    </button>
                </Tooltip>
            )}

            {onDownloadMap && (
                <Tooltip content={downloadMapTooltip} placement="left" delay={300}>
                    <button
                        type="button"
                        onClick={onDownloadMap}
                        className="flex items-center justify-center p-1 rounded-full border border-transparent transition-all bg-[#EAEFFA] text-[#703089] hover:border-purple shadow-[0px_6px_12px_#2F495C14] cursor-pointer"
                        aria-label="Descargar el mapa de esta selección"
                    >
                        <Icon name="poligono" className="size-5" />
                    </button>
                </Tooltip>
            )}

            {onCenter && (
                <Tooltip content={centerTooltip} placement="left" delay={300}>
                    <button
                        type="button"
                        onClick={onCenter}
                        className="flex items-center justify-center p-1 rounded-full border border-transparent transition-all bg-[#EAEFFA] text-[#703089] hover:border-purple shadow-[0px_6px_12px_#2F495C14]"
                    >
                        <Icon name="center_group" className="size-5" />
                    </button>
                </Tooltip>
            )}

            {onEdit && (
                <Tooltip content={editTooltip} placement="left" delay={300}>
                    <button
                        type="button"
                        onClick={onEdit}
                        className="flex items-center justify-center p-1 rounded-full border border-transparent transition-all bg-[#EAEFFA] text-[#703089] hover:border-purple shadow-[0px_6px_12px_#2F495C14]"
                    >
                        <Icon name="pencil" className="size-5" />
                    </button>
                </Tooltip>
            )}
        </div>
    );
};

export default ActionsToolbar;
