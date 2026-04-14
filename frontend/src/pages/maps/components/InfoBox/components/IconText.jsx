import Divider from '@components/Divider';
import Icon from '@components/Icon';

const buildHref = (icon, value) => {
    if (icon === 'celular') return `tel:${String(value).replace(/\s+/g, '')}`;
    if (icon === 'ubicacion') return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
    return null;
};

const IconText = ({ value, icon = 'ubicacion', showDivider = true, isLast = false, href: externalHref = null, onClick = null }) => {
    if (!value) return null;

    const href = externalHref || buildHref(icon, value);
    const isClickable = href || onClick;
    const textClass = 'flex-1 font-garet font-medium text-[10px]/[14px] tracking-normal';

    return (
        <>
            {showDivider && <Divider className="my-2" />}
            <div className={`flex items-center gap-2 py-1${isLast ? ' mb-3' : ''}`}>
                <Icon name={icon} className="w-3.5 h-3.5 shrink-0" />
                {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className={`${textClass} text-[#5C2472] underline`}>
                        {value}
                    </a>
                ) : onClick ? (
                    <button onClick={onClick} className={`${textClass} text-[#5C2472] underline text-left cursor-pointer`}>
                        {value}
                    </button>
                ) : (
                    <span className={`${textClass} ${isClickable ? 'text-[#5C2472] underline' : 'text-[#454545]'}`}>
                        {value}
                    </span>
                )}
            </div>
        </>
    );
};

export default IconText;
