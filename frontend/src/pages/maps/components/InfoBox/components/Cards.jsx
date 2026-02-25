import Icon from '@components/Icon';

const getGenderIcon = (label) => {
    if (!label) return null;
    const labelLower = label.toLowerCase();
    if (labelLower.includes('hombre')) return 'hombre';
    if (labelLower.includes('mujer')) return 'mujer';
    return null;
};

const FeatureCards = ({ cards, columns = 1 }) => {
    if (!cards || cards.length === 0) return null;

    const validCards = cards.filter(card => card.value !== null && card.value !== undefined && card.value !== '');
    if (validCards.length === 0) return null;

    return (
        <div className={`grid gap-2 mb-3 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {validCards.map((card, idx) => {
                const genderIcon = getGenderIcon(card.label);
                return (
                    <div
                        key={idx}
                        className="bg-[#EFF3FC] rounded-[5px] py-1 px-2 flex flex-col items-center justify-center"
                    >
                        <div className="text-sm font-bold text-gray-900 text-center">
                            {card.value}{card.suffix}
                        </div>
                        <div className="text-[9px] text-gray-600 text-center leading-tight mt-0.5 flex items-center gap-1">
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
