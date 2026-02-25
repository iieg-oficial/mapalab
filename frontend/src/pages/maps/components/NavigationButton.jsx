import Icon from '@components/Icon';

const NavigationButton = ({ direction, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="shrink-0 p-1"
            aria-label={direction === 'left' ? 'Anterior' : 'Siguiente'}
        >
            <Icon name={direction === 'left' ? 'xr' : 'xl'} className="size-4" />
        </button>
    );
};

export default NavigationButton;
