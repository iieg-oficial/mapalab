import InfoCard from '../components/InfoCard';
import Label from '../components/Label';
import List from '../components/List';
import IconText from '../components/IconText';
import Cards from '../components/Cards';
import Text from '../components/Text';
import { cardTemplates, CARACTERISTICA_STYLE } from './cardTemplates';
import { isTextKey, mkTextKey, normalizeFinalConfig, resolveHref, textIdOf } from './infoBoxTextBlocks';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { formatIsoAsMonthYear } from '@pages/maps/helpers/dateFilterHelpers';

const IS_NON_PROD = ['dev', 'beta'].includes(import.meta.env.VITE_APP_ENV);

export const applyHeaderTransform = (transform, value, featureId) => {
    if (!transform) return value;
    let result = transform.valueMap?.[value] ?? value;
    if (transform.featureIdSuffix) {
        const { match, ifMatch, ifNoMatch } = transform.featureIdSuffix;
        const suffix = featureId?.includes(match) ? ifMatch : ifNoMatch;
        if (suffix) result = `${result} ${suffix}`;
    }
    return result;
};

export const resolveStaticValue = (value, dateValue) => {
    if (typeof value !== 'object' || value === null) return value;
    if (value.dynamic === 'rasterDate') {
        return formatIsoAsMonthYear(dateValue) || value.fallback;
    }
    return value;
};

const extractSuffixFromLayerId = (layerId) => {
    if (!layerId) return null;

    const layerIdLower = layerId.toLowerCase();
    const commonSuffixes = ['hombres', 'mujeres', 'masculino', 'femenino', 'ninos', 'ninas', 'adultos', 'jovenes'];

    for (const suffix of commonSuffixes) {
        if (layerIdLower.includes(suffix)) {
            return suffix;
        }
    }

    return null;
};

const shouldIncludeField = (fieldName, suffix) => {
    if (!suffix || !fieldName) return true;

    const fieldLower = fieldName.toLowerCase();

    if (fieldLower.includes(suffix)) {
        return true;
    }

    const allSuffixes = ['hombres', 'mujeres', 'masculino', 'femenino', 'ninos', 'ninas', 'adultos', 'jovenes'];
    const otherSuffixes = allSuffixes.filter(s => s !== suffix);

    return !otherSuffixes.some(otherSuffix => fieldLower.includes(otherSuffix));
};

const renderLabels = ({ finalConfig, properties, variant, body }) => {
    if (!finalConfig.labels) return;
    const labelElements = [];
    finalConfig.labels.forEach((field, idx) => {
        if (properties[field]) {
            labelElements.push(
                <Label
                    key={`label-${idx}`}
                    value={properties[field]}
                    color={CARACTERISTICA_STYLE.color}
                    bg={CARACTERISTICA_STYLE.bg}
                    variant={variant}
                />
            );
        }
    });
    if (labelElements.length > 0) {
        body.push(
            <div key="labels-group" className="flex flex-wrap gap-1 mb-3">
                {labelElements}
            </div>
        );
    }
};

const renderLabelGroups = ({ finalConfig, properties, variant, dateValue, body }) => {
    if (!finalConfig.labelGroups) return;
    finalConfig.labelGroups.forEach((group, groupIdx) => {
        const groupElements = [];

        if (group.staticValues) {
            group.staticValues.forEach((value, idx) => {
                const resolvedValue = resolveStaticValue(value, dateValue);
                if (resolvedValue == null || resolvedValue === '') return;
                groupElements.push(
                    <Label
                        key={`labelgroup-${groupIdx}-static-${idx}`}
                        value={resolvedValue}
                        color={group.color}
                        bg={group.bg}
                    />
                );
            });
        }

        if (group.fields) {
            const fieldDefs = group.fields.map(f => typeof f === 'string' ? { field: f } : f);

            fieldDefs.forEach((def, idx) => {
                if (!def || !def.field) return;
                const value = properties[def.field];
                if (value === null || value === undefined || value === '') return;

                const color = def.color || group.color;
                const bg = def.bg || group.bg;

                if (group.splitValues && typeof value === 'string') {
                    const splitItems = value.split(/,\s*|\s+y\s+/).filter(item => item.trim() !== '');
                    splitItems.forEach((item, splitIdx) => {
                        groupElements.push(
                            <Label
                                key={`labelgroup-${groupIdx}-${idx}-${splitIdx}`}
                                value={item.trim()}
                                color={color}
                                bg={bg}
                                fullWidth={def.fullWidth}
                                variant={variant}
                            />
                        );
                    });
                } else {
                    groupElements.push(
                        <Label
                            key={`labelgroup-${groupIdx}-${idx}`}
                            value={value}
                            color={color}
                            bg={bg}
                            fullWidth={def.fullWidth}
                            variant={variant}
                        />
                    );
                }
            });
        }

        if (groupElements.length > 0) {
            body.push(
                <div key={`labelgroup-${groupIdx}`} className="flex flex-wrap gap-1 mb-3">
                    {groupElements}
                </div>
            );
        }
    });
};

const renderList = ({ finalConfig, properties, suffix, variant, body, getValue }) => {
    if (!finalConfig.list) return;
    const rows = finalConfig.list
        .filter(row => shouldIncludeField(row.field, suffix))
        .map(row => ({
            label: row.label,
            value: properties[row.field],
            raw: row.raw,
            href: resolveHref(row.href, getValue),
        }))
        .filter(row => row.value !== null && row.value !== undefined && row.value !== '');

    if (rows.length > 0) {
        body.push(
            <List
                key="list"
                rows={rows}
                variant={variant}
            />
        );
    }
};

const renderIconText = ({ finalConfig, properties, onAction, variant, body }) => {
    if (!finalConfig.iconText) return;
    const iconTextItems = Array.isArray(finalConfig.iconText) ? finalConfig.iconText : [finalConfig.iconText];
    const validItems = iconTextItems
        .filter(item => item && (properties[item.field] || item.value))
        .filter(item => IS_NON_PROD || item.action !== 'report');
    validItems.forEach((item, idx) => {
        const iconTextProps = {
            icon: item.icon,
            value: item.value || properties[item.field],
            showDivider: idx === 0,
            isLast: idx === validItems.length - 1,
        };
        if (item.href) iconTextProps.href = item.href;
        if (item.action && onAction) iconTextProps.onClick = () => onAction(item.action);
        body.push(<IconText key={`icontext-${idx}`} {...iconTextProps} variant={variant} />);
    });
};

const renderTextBlock = ({ block, getValue, variant, body }) => {
    if (!block?.items?.length) return;
    block.items.forEach((textItem, idx) => {
        const value = textItem.field ? getValue(textItem.field) : null;
        if (textItem.label || value) {
            body.push(
                <Text
                    key={`text-${block.id}-${idx}`}
                    label={textItem.label}
                    value={value}
                    href={resolveHref(textItem.href, getValue)}
                    variant={variant}
                />
            );
        }
    });
};

const renderCards = ({ finalConfig, properties, suffix, variant, body }) => {
    if (!finalConfig.cards) return;
    const cards = finalConfig.cards
        .filter(Boolean)
        .filter(card => shouldIncludeField(card.field, suffix))
        .map(card => {
            let value = properties[card.field];
            if (card.raw) {
                value = value ?? '';
            } else if (card.decimals != null && typeof value === 'number') {
                value = formatNumber(value.toFixed(card.decimals));
            } else if (typeof value === 'number') {
                value = formatNumber(value);
            }
            return {
                label: card.label,
                value,
                suffix: card.suffix || ''
            };
        })
        .filter(card => card.value !== null && card.value !== undefined && card.value !== '');

    if (cards.length > 0) {
        const effectiveColumns = finalConfig.cardsColumns ?? (variant === 'mobile' ? 2 : 1);
        body.push(
            <Cards
                key="cards"
                cards={cards}
                columns={effectiveColumns}
                variant={variant}
            />
        );
    }
};

const BODY_RENDERERS = {
    labels: renderLabels,
    labelGroups: renderLabelGroups,
    list: renderList,
    iconText: renderIconText,
    cards: renderCards,
};

const DEFAULT_BODY_ORDER = ['labels', 'labelGroups', 'list', 'iconText', 'text', 'cards'];

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

export const renderCard = (properties, config, onClose, layerId = null, featureId = null, onAction = null, variant = 'desktop', cardIndex = null, cardTotal = null, dateValue = null) => {
    const suffix = extractSuffixFromLayerId(layerId);
    const isMobile = variant === 'mobile';

    const getValue = (field) => {
        if (!field) return '';
        const key = Object.keys(properties).find(k => k.toLowerCase() === field.toLowerCase());
        return key ? properties[key] : '';
    };

    if (!properties) return null;

    const finalConfig = normalizeFinalConfig(config || cardTemplates.generateDefaultConfig(properties));
    if (!finalConfig) return null;

    let titleValue = null;
    const body = [];

    if (finalConfig.headerField) {
        const headerValueFromProperties = getValue(finalConfig.headerField);
        const rawHeaderValue = headerValueFromProperties || finalConfig.headerField;
        titleValue = applyHeaderTransform(finalConfig.headerTransform, rawHeaderValue, featureId);
    }

    const ctx = { finalConfig, properties, suffix, variant, dateValue, onAction, getValue, body };
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
                <div className={isMobile ? 'px-5' : 'px-4'}>
                    {body}
                </div>
            )}
        </InfoCard>
    );
};
