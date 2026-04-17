import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';

const InfoBoxTools = ({ tools = [], className = '' }) => {
    const visibleTools = tools.filter(Boolean);
    if (visibleTools.length === 0) return null;

    return (
        <div className={`flex items-center gap-3 flex-wrap shrink-0 ${className}`}>
            {visibleTools.map(tool => {
                const content = (
                    <button
                        type="button"
                        onClick={tool.onClick}
                        disabled={tool.disabled}
                        className={`group/tool flex items-center gap-1 ${tool.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        aria-label={tool.label}
                    >
                        <span className="p-0.5 rounded-full border border-transparent group-hover/tool:border-[#5C2472] transition-colors">
                            <Icon name={tool.icon} className="size-4 text-[#5C2472]" />
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
