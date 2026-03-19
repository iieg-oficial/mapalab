import Header from '../components/Header';
import Label from '../components/Label';
import List from '../components/List';
import IconText from '../components/IconText';
import Cards from '../components/Cards';
import Text from '../components/Text';
import { cardTemplates, CARACTERISTICA_STYLE } from './cardTemplates';
import { formatNumber } from '@pages/maps/helpers/formatNumber';

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

export const renderCard = (properties, config, onClose, layerId = null, featureId = null) => {
    const suffix = extractSuffixFromLayerId(layerId);

    const getValue = (field) => {
        if (!field) return '';
        const key = Object.keys(properties).find(k => k.toLowerCase() === field.toLowerCase());
        return key ? properties[key] : '';
    };

    if (!properties) return null;

    const finalConfig = config || cardTemplates.generateDefaultConfig(properties);
    if (!finalConfig) return null;

    const header = [];
    const body = [];

    if (finalConfig.headerField) {
        const headerValueFromProperties = getValue(finalConfig.headerField);
        const rawHeaderValue = headerValueFromProperties || finalConfig.headerField;
        const finalHeaderValue = finalConfig.headerTransform ? finalConfig.headerTransform(rawHeaderValue, featureId) : rawHeaderValue;

        if (finalHeaderValue) {
            header.push(
                <Header
                    key="header"
                    value={finalHeaderValue}
                    onClose={onClose}
                />
            );
        }
    }

    if (finalConfig.labels) {
        const labelElements = [];
        finalConfig.labels.forEach((field, idx) => {
            if (properties[field]) {
                labelElements.push(
                    <Label
                        key={`label-${idx}`}
                        value={properties[field]}
                        color={CARACTERISTICA_STYLE.color}
                        bg={CARACTERISTICA_STYLE.bg}
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
    }

    if (finalConfig.labelGroups) {
        finalConfig.labelGroups.forEach((group, groupIdx) => {
            const groupElements = [];

            if (group.staticValues) {
                group.staticValues.forEach((value, idx) => {
                    groupElements.push(
                        <Label
                            key={`labelgroup-${groupIdx}-static-${idx}`}
                            value={value}
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
    }

    if (finalConfig.list) {
        const rows = finalConfig.list
            .filter(row => shouldIncludeField(row.field, suffix))
            .map(row => ({
                label: row.label,
                value: properties[row.field]
            }))
            .filter(row => row.value !== null && row.value !== undefined && row.value !== '');

        if (rows.length > 0) {
            body.push(
                <List
                    key="list"
                    rows={rows}
                />
            );
        }
    }

    if (finalConfig.iconText) {
        const iconTextItems = Array.isArray(finalConfig.iconText) ? finalConfig.iconText : [finalConfig.iconText];
        const validItems = iconTextItems.filter(item => item && properties[item.field]);
        validItems.forEach((item, idx) => {
            body.push(
                <IconText
                    key={`icontext-${idx}`}
                    icon={item.icon}
                    value={properties[item.field]}
                    showDivider={idx === 0}
                    isLast={idx === validItems.length - 1}
                />
            );
        });
    }

    if (finalConfig.text) {
        finalConfig.text.forEach((textItem, idx) => {
            const value = textItem.field ? getValue(textItem.field) : null;
            if (textItem.label || value) {
                body.push(
                    <Text
                        key={`text-${idx}`}
                        label={textItem.label}
                        value={value}
                    />
                );
            }
        });
    }

    if (finalConfig.cards) {
        const cards = finalConfig.cards
            .filter(Boolean)
            .filter(card => shouldIncludeField(card.field, suffix))
            .map(card => {
                let value = properties[card.field];
                if (card.decimals != null && typeof value === 'number') {
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
            body.push(
                <Cards
                    key="cards"
                    cards={cards}
                    columns={finalConfig.cardsColumns || 1}
                />
            );
        }
    }

    if (header.length === 0 && body.length === 0) return null;

    return (
        <>
            {header}
            {body.length > 0 && (
                <div className="px-4">
                    {body}
                </div>
            )}
        </>
    );
};
