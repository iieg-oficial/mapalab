import FeatureHeader from '../components/FeatureHeader';
import FeatureLabel from '../components/FeatureLabel';
import FeatureList from '../components/FeatureList';
import FeatureIconText from '../components/FeatureIconText';
import FeatureCards from '../components/FeatureCards';

export const renderConfiguredFeature = (properties, config, onClose) => {
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
            .map(card => ({
                label: card.label,
                value: properties[card.field]
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
