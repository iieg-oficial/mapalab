import Icon from '@components/Icon';

const MenuItem = ({ children, iconName, onClick, className = '' }) => {
    return (
        <button 
            onClick={onClick}
            className={`
                w-full text-left hover:bg-black/5 
                ${className}
            `}
        >
            {iconName && <Icon name={iconName} />}
            {children}
        </button>
    );
};

export default MenuItem;