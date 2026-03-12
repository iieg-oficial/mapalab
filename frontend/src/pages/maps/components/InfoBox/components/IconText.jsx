import Divider from '@components/Divider';
import Icon from '@components/Icon';

const IconText = ({ value, icon = 'ubicacion', showDivider = true }) => {
    if (!value) return null;

    return (
        <>
            {showDivider && <Divider className="m-0" />}
            <div className="flex items-start gap-2 pt-3">
                <Icon name={icon} className="w-3.5 h-3.5" />
                <span className="flex-1 font-garet font-medium text-[10px]/[14px] text-[#454545] tracking-normal">
                    {value}
                </span>
            </div>
        </>
    );
};

export default IconText;
