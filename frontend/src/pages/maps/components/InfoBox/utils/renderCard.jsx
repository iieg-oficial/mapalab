import InfoCard from '../components/InfoCard';
import { cardTemplates } from './cardTemplates';
import { normalizeFinalConfig } from './infoBoxTextBlocks';
import { makeValueResolver } from './resolveFieldValue';
import {
    applyHeaderTransform,
    blockInstances,
    BODY_RENDERERS,
    BODY_TYPES,
    extractSuffixFromLayerId,
} from './cardBlocks.jsx';

export { applyHeaderTransform, resolveStaticValue } from './cardBlocks.jsx';

const presentInstances = (cfg) => BODY_TYPES.flatMap((type) => blockInstances(cfg, type));

const resolveBodyOrder = (instances, blockOrder) => {
    const present = instances.map((i) => i.key);
    const validKeys = new Set(present);
    const explicit = Array.isArray(blockOrder)
        ? blockOrder.filter((k) => validKeys.has(k))
        : [];
    const remaining = present.filter((k) => !explicit.includes(k));
    return [...explicit, ...remaining];
};

const resolveHeader = (headerDef, resolve, featureId, headerTransform) => {
    if (!headerDef) return null;
    const resolved = resolve(headerDef);
    const fallback = typeof headerDef === 'string' ? headerDef : '';
    return applyHeaderTransform(headerTransform, resolved || fallback, featureId);
};

export const renderCard = (properties, config, onClose, layerId = null, featureId = null, onAction = null, variant = 'desktop', cardIndex = null, cardTotal = null, dateValue = null) => {
    if (!properties) return null;

    const finalConfig = normalizeFinalConfig(config || cardTemplates.generateDefaultConfig(properties));
    if (!finalConfig) return null;

    const { resolve, readField } = makeValueResolver(properties);
    const suffix = extractSuffixFromLayerId(layerId);
    const isMobile = variant === 'mobile';
    const body = [];

    const titleValue = resolveHeader(finalConfig.headerField, resolve, featureId, finalConfig.headerTransform);

    const ctx = { finalConfig, suffix, variant, dateValue, onAction, resolve, getValue: readField, body };
    const instances = presentInstances(finalConfig);
    const byKey = new Map(instances.map((i) => [i.key, i]));
    resolveBodyOrder(instances, finalConfig.blockOrder).forEach((key) => {
        const instance = byKey.get(key);
        if (!instance) return;
        BODY_RENDERERS[instance.type]?.({ ...ctx, items: instance.items, blockKey: instance.key });
    });

    if (!titleValue && body.length === 0) return null;

    return (
        <InfoCard
            title={titleValue}
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
