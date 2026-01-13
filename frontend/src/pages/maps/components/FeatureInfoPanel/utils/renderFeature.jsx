import FeatureHeader from '../components/FeatureHeader';
import FeatureLabel from '../components/FeatureLabel';
import FeatureList from '../components/FeatureList';
import FeatureIconText from '../components/FeatureIconText';
import FeatureCards from '../components/FeatureCards';

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

export const renderConfiguredFeature = (properties, config, onClose, layerId = null) => {
    const suffix = extractSuffixFromLayerId(layerId);

    const getValue = (field) => {
        if (!field) return '';
        const key = Object.keys(properties).find(k => k.toLowerCase() === field.toLowerCase());
        return key ? properties[key] : '';
    };

    if (!config || !properties) return null;

    const header = [];
    const body = [];

    if (config.headerField) {
        const headerValueFromProperties = getValue(config.headerField);
        const finalHeaderValue = headerValueFromProperties || config.headerField;

        if (finalHeaderValue) {
            header.push(
                <FeatureHeader
                    key="header"
                    value={finalHeaderValue}
                    onClose={onClose}
                />
            );
        }
    }

    if (config.labels) {
        const labelElements = [];
        config.labels.forEach((field, idx) => {
            if (properties[field]) {
                labelElements.push(
                    <FeatureLabel
                        key={`label-${idx}`}
                        value={properties[field]}
                        index={idx}
                    />
                );
            }
        });
        if (labelElements.length > 0) {
            body.push(
                <div key="labels-group" className="flex flex-wrap gap-1 mb-2">
                    {labelElements}
                </div>
            );
        }
    }

    if (config.labelGroups) {
        config.labelGroups.forEach((group, groupIdx) => {
            const values = group.fields
                .map(field => properties[field])
                .filter(v => v !== null && v !== undefined && v !== '');

            const groupElements = [];
            values.forEach((value, idx) => {
                if (group.splitValues && typeof value === 'string') {
                    const splitItems = value.split(/,\s*|\s+y\s+/).filter(item => item.trim() !== '');
                    splitItems.forEach((item, splitIdx) => {
                        groupElements.push(
                            <FeatureLabel
                                key={`labelgroup-${groupIdx}-${idx}-${splitIdx}`}
                                value={item.trim()}
                                index={config.labels ? config.labels.length + idx + splitIdx : idx + splitIdx}
                            />
                        );
                    });
                } else {
                    groupElements.push(
                        <FeatureLabel
                            key={`labelgroup-${groupIdx}-${idx}`}
                            value={value}
                            index={config.labels ? config.labels.length + idx : idx}
                        />
                    );
                }
            });

            if (groupElements.length > 0) {
                body.push(
                    <div key={`labelgroup-${groupIdx}`} className="flex flex-wrap gap-1 mb-2">
                        {groupElements}
                    </div>
                );
            }
        });
    }

    if (config.list) {
        const rows = config.list
            .filter(row => shouldIncludeField(row.field, suffix))
            .map(row => ({
                label: row.label,
                value: properties[row.field]
            }))
            .filter(row => row.value !== null && row.value !== undefined && row.value !== '');

        if (rows.length > 0) {
            body.push(
                <FeatureList
                    key="list"
                    rows={rows}
                />
            );
        }
    }

    if (config.iconText && properties[config.iconText.field]) {
        body.push(
            <FeatureIconText
                key="icontext"
                icon={config.iconText.icon}
                value={properties[config.iconText.field]}
            />
        );
    }

    if (config.cards) {
        const cards = config.cards
            .filter(Boolean)
            .filter(card => shouldIncludeField(card.field, suffix))
            .map(card => ({
                label: card.label,
                value: properties[card.field],
                suffix: card.suffix || ''
            }))
            .filter(card => card.value !== null && card.value !== undefined && card.value !== '');

        if (cards.length > 0) {
            body.push(
                <FeatureCards
                    key="cards"
                    cards={cards}
                    columns={config.cardsColumns || 1}
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
