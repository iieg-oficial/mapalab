import Label from '../components/Label';
import List from '../components/List';
import IconText from '../components/IconText';
import Cards from '../components/Cards';
import Text from '../components/Text';
import { resolveHref } from './infoBoxTextBlocks';
import { isJoinedDef, splitMultivalue } from './resolveFieldValue';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { formatIsoAsMonthYear } from '@pages/maps/helpers/dateFilterHelpers';

const IS_NON_PROD = ['dev', 'beta'].includes(import.meta.env.VITE_APP_ENV);

const GENDER_SUFFIXES = ['hombres', 'mujeres', 'masculino', 'femenino', 'ninos', 'ninas', 'adultos', 'jovenes'];

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

export const extractSuffixFromLayerId = (layerId) => {
    if (!layerId) return null;

    const layerIdLower = layerId.toLowerCase();

    for (const suffix of GENDER_SUFFIXES) {
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

    const otherSuffixes = GENDER_SUFFIXES.filter(s => s !== suffix);

    return !otherSuffixes.some(otherSuffix => fieldLower.includes(otherSuffix));
};

const isEmptyValue = (value) => value === null || value === undefined || value === '';

export const BODY_TYPES = ['labelGroups', 'list', 'iconText', 'text', 'cards'];

const isInstanced = (arr) => !!arr[0]
    && typeof arr[0] === 'object'
    && typeof arr[0].id === 'string'
    && Array.isArray(arr[0].items);

export const blockInstances = (cfg, type) => {
    const raw = cfg?.[type];
    if (raw == null) return [];
    if (!Array.isArray(raw)) return [{ key: type, type, items: [raw] }];
    if (raw.length === 0) return [];
    if (isInstanced(raw)) {
        return raw.map((block) => ({ key: `${type}:${block.id}`, type, items: block.items || [] }));
    }
    return [{ key: type, type, items: raw }];
};

const renderLabelGroups = ({ items, blockKey, resolve, variant, dateValue, body }) => {
    items.forEach((group, groupIdx) => {
        const groupElements = [];

        if (group.staticValues) {
            group.staticValues.forEach((value, idx) => {
                const resolvedValue = resolveStaticValue(value, dateValue);
                if (isEmptyValue(resolvedValue)) return;
                groupElements.push(
                    <Label
                        key={`${blockKey}-${groupIdx}-static-${idx}`}
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
                if (!def || (!def.field && !def.compose)) return;
                const value = resolve(def);
                if (isEmptyValue(value)) return;

                const color = def.color || group.color;
                const bg = def.bg || group.bg;
                const commonProps = { color, bg, fullWidth: def.fullWidth, variant };

                if ((def.split ?? group.splitValues) && typeof value === 'string') {
                    splitMultivalue(value).forEach((item, splitIdx) => {
                        groupElements.push(
                            <Label key={`${blockKey}-${groupIdx}-${idx}-${splitIdx}`} value={item} {...commonProps} />
                        );
                    });
                } else {
                    groupElements.push(
                        <Label key={`${blockKey}-${groupIdx}-${idx}`} value={value} {...commonProps} />
                    );
                }
            });
        }

        if (groupElements.length > 0) {
            body.push(
                <div key={`${blockKey}-${groupIdx}`} className="flex flex-wrap gap-1 mb-3">
                    {groupElements}
                </div>
            );
        }
    });
};

const renderList = ({ items, blockKey, suffix, variant, body, resolve, getValue }) => {
    const rows = items
        .filter(row => shouldIncludeField(row.field, suffix))
        .map(row => {
            const value = resolve(row);
            return {
                label: row.label,
                value,
                values: row.split ? splitMultivalue(value) : null,
                raw: row.raw || isJoinedDef(row),
                href: resolveHref(row.href, getValue),
            };
        })
        .filter(row => !isEmptyValue(row.value) && (!row.values || row.values.length > 0));

    if (rows.length > 0) {
        body.push(
            <List
                key={blockKey}
                rows={rows}
                variant={variant}
            />
        );
    }
};

const renderIconText = ({ items, blockKey, onAction, variant, body, resolve, getValue }) => {
    const validItems = items
        .filter(item => item)
        .map(item => ({ item, fieldValue: resolve(item) }))
        .filter(({ item, fieldValue }) => item.label || fieldValue || item.value)
        .filter(({ item }) => IS_NON_PROD || item.action !== 'report');
    validItems.forEach(({ item, fieldValue }, idx) => {
        const displayValue = item.label || item.value || fieldValue;
        const iconTextProps = {
            icon: item.icon,
            value: displayValue,
            hrefValue: fieldValue || item.value || displayValue,
            showDivider: idx === 0,
            isLast: idx === validItems.length - 1,
        };
        const resolvedHref = item.href ? resolveHref(item.href, getValue) : null;
        if (resolvedHref) iconTextProps.href = resolvedHref;
        if (item.action && onAction) iconTextProps.onClick = () => onAction(item.action);
        body.push(<IconText key={`${blockKey}-${idx}`} {...iconTextProps} variant={variant} />);
    });
};

const renderTextBlock = ({ items, blockKey, resolve, getValue, variant, body }) => {
    items.forEach((textItem, idx) => {
        const value = resolve(textItem);
        if (textItem.label || value) {
            body.push(
                <Text
                    key={`${blockKey}-${idx}`}
                    label={textItem.label}
                    value={value}
                    href={resolveHref(textItem.href, getValue)}
                    variant={variant}
                />
            );
        }
    });
};

const renderCards = ({ items, blockKey, finalConfig, suffix, variant, body, resolve }) => {
    const cards = items
        .filter(Boolean)
        .filter(card => shouldIncludeField(card.field, suffix))
        .map(card => {
            let value = resolve(card);
            const raw = card.raw || isJoinedDef(card);
            if (raw) {
                value = value ?? '';
            } else if (card.decimals != null && typeof value === 'number') {
                value = formatNumber(value.toFixed(card.decimals));
            } else if (typeof value === 'number') {
                value = formatNumber(value);
            }
            return {
                label: card.label,
                value,
                raw,
                suffix: card.suffix || ''
            };
        })
        .filter(card => !isEmptyValue(card.value));

    if (cards.length > 0) {
        const effectiveColumns = finalConfig.cardsColumns ?? (variant === 'mobile' ? 2 : 1);
        body.push(
            <Cards
                key={blockKey}
                cards={cards}
                columns={effectiveColumns}
                variant={variant}
            />
        );
    }
};

export const BODY_RENDERERS = {
    labelGroups: renderLabelGroups,
    list: renderList,
    iconText: renderIconText,
    text: renderTextBlock,
    cards: renderCards,
};
