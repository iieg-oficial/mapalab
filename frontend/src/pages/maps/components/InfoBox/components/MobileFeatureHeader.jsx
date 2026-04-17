import Divider from '@components/Divider';

const MobileFeatureHeader = ({ value, index, total }) => {
    if (!value) return null;

    const showBadge = index != null && total != null && total > 0;

    return (
        <>
            <div className="flex items-start gap-2 px-5 pt-4 pb-3">
                <h3 className="font-garet font-bold text-[13px]/[17px] text-[#2E4372] flex-1">
                    {value}
                </h3>
                {showBadge && (
                    <span className="shrink-0 font-garet font-bold text-[10px]/[16px] px-2 py-0.5 rounded-full bg-[#F4EFF9] text-[#5C2472] tabular-nums">
                        {index}/{total}
                    </span>
                )}
            </div>
            <Divider className="mx-5 mb-3" />
        </>
    );
};

export default MobileFeatureHeader;
