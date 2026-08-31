import Icon from '@components/Icon';

const FeatureCards = ({ cards, columns = 1, variant = 'desktop' }) => {
    if (!cards || cards.length === 0) return null;

    const validCards = cards.filter(card => card.value !== null && card.value !== undefined && card.value !== '');
    if (validCards.length === 0) return null;

    const valueSize = variant === 'mobile' ? 'text-[15px]' : 'text-sm';
    const labelSize = variant === 'mobile' ? 'text-[11px]' : 'text-[9px]';

    return (
        <div className={`grid gap-2 mb-3 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {validCards.map((card, idx) => {
                const genderIcon = card.icon;
                return (
                    <div
                        key={idx}
                        className="bg-[#EFF3FC] rounded-[5px] py-1 px-2 flex flex-col items-center justify-center"
                    >
                        <div className={`${valueSize} font-garet font-bold text-gray-900 text-center`}>
                            {card.value}{card.suffix}
                        </div>
                        <div className={`${labelSize} font-garet text-gray-600 text-center leading-tight mt-0.5 flex items-center gap-1`}>
                            {genderIcon && <Icon name={genderIcon} className="w-3 h-4" />}
                            {card.label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default FeatureCards;
