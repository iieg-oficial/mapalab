const FeatureCards = ({ cards, columns = 1 }) => {
    if (!cards || cards.length === 0) return null;

    const validCards = cards.filter(card => card.value !== null && card.value !== undefined && card.value !== '');
    if (validCards.length === 0) return null;

    return (
        <div className={`grid gap-2 mb-3 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {validCards.map((card, idx) => (
                <div
                    key={idx}
                    className="bg-[#EFF3FC] rounded-[5px] py-1 px-2 flex flex-col items-center justify-center"
                >
                    <div className="text-sm font-bold text-gray-900 text-center">
                        {card.value}
                    </div>
                    <div className="text-[9px] text-gray-600 text-center leading-tight mt-0.5">
                        {card.label}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FeatureCards;
