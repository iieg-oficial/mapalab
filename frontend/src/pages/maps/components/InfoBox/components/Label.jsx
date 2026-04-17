import { CARACTERISTICA_STYLE } from '../utils/cardTemplates';

const FeatureLabel = ({ value, color = CARACTERISTICA_STYLE.color, bg = CARACTERISTICA_STYLE.bg, fullWidth = false, variant = 'desktop' }) => {
    if (!value) return null;

    const size = variant === 'mobile' ? 'text-[12px]/[16px]' : 'text-[10px]/[14px]';

    if (fullWidth) {
        return (
            <div className="w-full">
                <p
                    className={`font-garet font-bold ${size} px-2 py-1 rounded-[5px] w-fit`}
                    style={{ color, backgroundColor: bg }}
                >
                    {value}
                </p>
            </div>
        );
    }

    return (
        <p
            className={`font-garet font-bold ${size} px-2 py-1 rounded-[5px]`}
            style={{ color, backgroundColor: bg }}
        >
            {value}
        </p>
    );
};

export default FeatureLabel;
