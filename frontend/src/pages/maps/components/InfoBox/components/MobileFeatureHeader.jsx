import Divider from '@components/Divider';
import Badge from '@components/Badge';

const MobileFeatureHeader = ({ value, index, total }) => {
    if (!value) return null;

    const showBadge = index != null && total != null && total > 0;

    return (
        <>
            <div className="flex items-start gap-2 px-5 pt-4 pb-3">
                <h3 className="font-garet font-bold text-[13px]/[17px] text-[#2E4372] flex-1">
                    {value}
                </h3>
                <Badge
                    visible={showBadge}
                    variant="pill"
                    color="violet"
                    text={`${index}/${total}`}
                />
            </div>
            <Divider className="mx-5 mb-3" />
        </>
    );
};

export default MobileFeatureHeader;
