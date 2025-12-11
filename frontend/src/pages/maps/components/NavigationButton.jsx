import Icon from '@components/Icon';

const NavigationButton = ({ direction, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            aria-label={direction === 'left' ? 'Anterior' : 'Siguiente'}
        >
            <Icon name={direction === 'left' ? 'chevron_left' : 'chevron_right'} className="w-5 h-5" />
        </button>
    );
};

export default NavigationButton;
