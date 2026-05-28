import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { trackInfoBoxAction } from '@services/analyticsService';

const InfoBoxTools = ({ tools = [], className = '', layerId = null }) => {
    const visibleTools = tools.filter(Boolean);
    if (visibleTools.length === 0) return null;

    const handleClick = (tool) => () => {
        trackInfoBoxAction(tool.id || tool.label || 'unknown', layerId);
        tool.onClick?.();
    };

    return (
        <div className={`flex items-center gap-3 flex-wrap shrink-0 ${className}`}>
            {visibleTools.map(tool => {
                const content = (
                    <button
                        type="button"
                        onClick={handleClick(tool)}
                        disabled={tool.disabled}
                        className={`group/tool flex items-center gap-1 ${tool.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        aria-label={tool.label}
                    >
                        <span className="p-0.5 rounded-full border border-transparent group-hover/tool:border-purple transition-colors text-purple">
                            {tool.iconNode || <Icon name={tool.icon} className="size-4 text-purple" />}
                        </span>
                        <span className="text-[10px] font-garet font-medium text-[#465055] group-hover/tool:text-[#5C2472] whitespace-nowrap leading-none pt-[1.5px] transition-colors">
                            {tool.label}
                        </span>
                    </button>
                );

                return tool.tooltip
                    ? <Tooltip key={tool.id} content={tool.tooltip} delay={300} interactive>{content}</Tooltip>
                    : <span key={tool.id}>{content}</span>;
            })}
        </div>
    );
};

export default InfoBoxTools;
