import InfoCard from '../components/InfoCard';
import { cardTemplates } from './cardTemplates';
import { isTextKey, mkTextKey, normalizeFinalConfig, textIdOf } from './infoBoxTextBlocks';
import { makeValueResolver } from './resolveFieldValue';
import {
    applyHeaderTransform,
    BODY_RENDERERS,
    extractSuffixFromLayerId,
    renderTextBlock,
} from './cardBlocks.jsx';

export { applyHeaderTransform, resolveStaticValue } from './cardBlocks.jsx';

const DEFAULT_BODY_ORDER = ['labelGroups', 'list', 'iconText', 'text', 'cards'];

const expandPresentKeys = (cfg) => {
    const out = [];
    for (const k of DEFAULT_BODY_ORDER) {
        if (k === 'text') {
            (cfg.text || []).forEach((b) => out.push(mkTextKey(b.id)));
        } else {
            out.push(k);
        }
    }
    return out;
};

const resolveBodyOrder = (cfg) => {
    const present = expandPresentKeys(cfg);
    const validKeys = new Set(present);
    const explicit = Array.isArray(cfg.blockOrder)
        ? cfg.blockOrder.filter((k) => validKeys.has(k))
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
    resolveBodyOrder(finalConfig).forEach((key) => {
        if (isTextKey(key)) {
            const id = textIdOf(key);
            const block = (finalConfig.text || []).find((b) => b.id === id);
            renderTextBlock({ ...ctx, block });
            return;
        }
        BODY_RENDERERS[key]?.(ctx);
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
