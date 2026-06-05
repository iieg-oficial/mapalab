import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import Badge from '@components/Badge';

const HistoryButton = ({
    count = 0,
    onClick,
    buttonRef,
    isOpen,
    tooltip = 'Mis mediciones y anotaciones',
    className = ''
}) => {
    if (count <= 0) return null;

    const iconState = isOpen ? 'hover' : 'normal';

    return (
        <Tooltip content={tooltip} placement='right' delay={500}>
            <button
                ref={buttonRef}
                type='button'
                onClick={onClick}
                className={[
                    'relative size-12.5 flex items-center justify-center rounded-full border border-transparent transition-all',
                    isOpen ? 'bg-[#703089]' : 'bg-[#EAEFFA] hover:border-[#703089] active:bg-[#5C2472]',
                    className
                ].join(' ')}
                aria-label={`Ver lista de mediciones (${count})`}
            >
                <Icon name='lista' state={iconState} className='size-10' />
                <Badge visible={!isOpen} count={count} className='absolute -top-1 -right-1' />
            </button>
        </Tooltip>
    );
};

export default HistoryButton;
