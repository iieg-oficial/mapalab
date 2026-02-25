import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';

const ActionsToolbar = ({ onClear, onDownload, visible = true }) => {
    if (!visible) return null;

    const buttons = [
        {
            id: 'clear',
            icon: 'cerrar',
            tooltip: 'Cerrar todas las tarjetas',
            className: 'bg-[#FFE6EC] text-[#703089] hover:border-[#FF577D]',
            onClick: onClear
        }, {
            id: 'download',
            icon: 'download',
            tooltip: 'Descargar información',
            className: '',
            onClick: onDownload
        }
    ];

    return (
        <div className="flex flex-col gap-1.5">
            {buttons.map((button) => (
                <Tooltip key={button.id} content={button.tooltip} placement="left" delay={300}>
                    <button
                        type="button"
                        onClick={button.onClick}
                        className={`
                            ${button.className} flex items-center justify-center p-1 rounded-full
                            border border-transparent transition-all bg-[#EAEFFA] text-[#703089]
                            hover:border-[#5C2472] shadow-[0px_6px_12px_#2F495C14]
                        `}
                    >
                        <Icon name={button.icon} className="size-5" />
                    </button>
                </Tooltip>
            ))}
        </div>
    );
};

export default ActionsToolbar;
