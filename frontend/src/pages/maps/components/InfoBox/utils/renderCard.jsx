import InfoCard from '../components/InfoCard';
import { buildCardPlan } from '@utils/infoboxPlan';
import { PINTORES } from './cardBlocks.jsx';

const IS_NON_PROD = ['dev', 'beta'].includes(import.meta.env.VITE_APP_ENV);

export const renderCard = (properties, config, onClose, layerId = null, featureId = null, onAction = null, variant = 'desktop', cardIndex = null, cardTotal = null, dateValue = null) => {
    const plan = buildCardPlan(properties, config, {
        layerId,
        featureId,
        dateValue,
        variant,
        allowActions: IS_NON_PROD,
    });
    if (!plan || plan.isEmpty) return null;

    const isMobile = variant === 'mobile';
    const body = plan.blocks.map((block) => PINTORES[block.type]?.({ block, variant, onAction }));

    return (
        <InfoCard
            title={plan.title}
            variant={variant}
            index={cardIndex}
            total={cardTotal}
            onClose={onClose}
            className="pb-2"
        >
            {body.length > 0 && (
                <div className={`flex-1 flex flex-col justify-center ${isMobile ? 'px-5' : 'px-4'}`}>
                    {body}
                </div>
            )}
        </InfoCard>
    );
};
