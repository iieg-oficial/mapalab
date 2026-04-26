import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';

const formatCount = (n) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`.replace('.0k', 'k');
    return String(n);
};

const ActionsToolbar = ({ onClear, onDownload, visible = true, downloadCount = null, downloadShowsPlus = false, downloadTooltip = 'Descargar información' }) => {
    if (!visible) return null;

    return (
        <div className="flex flex-col gap-1.5">
            <Tooltip content="Cerrar todas las tarjetas" placement="left" delay={300}>
                <button
                    type="button"
                    onClick={onClear}
                    className="bg-[#FFE6EC] text-[#703089] hover:border-[#FF577D] flex items-center justify-center p-1 rounded-full border border-transparent transition-all shadow-[0px_6px_12px_#2F495C14]"
                >
                    <Icon name="cerrar" className="size-5" />
                </button>
            </Tooltip>

            <Tooltip content={downloadTooltip} placement="left" delay={300}>
                <button
                    type="button"
                    onClick={onDownload}
                    className="relative flex items-center justify-center p-1 rounded-full border border-transparent transition-all bg-[#EAEFFA] text-[#703089] hover:border-[#5C2472] shadow-[0px_6px_12px_#2F495C14]"
                >
                    <Icon name="download" className="size-5" />
                    {downloadCount != null && downloadCount > 0 && (
                        <span className="absolute -bottom-1.5 -right-3 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-[#FF8300] text-white text-[10px]/[12px] font-bold tabular-nums shadow-sm">
                            {formatCount(downloadCount)}{downloadShowsPlus ? '+' : ''}
                        </span>
                    )}
                </button>
            </Tooltip>
        </div>
    );
};

export default ActionsToolbar;
