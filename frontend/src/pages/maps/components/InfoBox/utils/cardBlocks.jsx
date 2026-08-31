import Label from '../components/Label';
import List from '../components/List';
import IconText from '../components/IconText';
import Cards from '../components/Cards';
import Text from '../components/Text';

const pintarLabelGroups = ({ block, variant }) => block.groups.map((grupo, idx) => (
    <div key={`${block.key}-${idx}`} className="flex flex-wrap gap-1 mb-3">
        {grupo.labels.map((etiqueta, i) => (
            <Label
                key={i}
                value={etiqueta.value}
                color={etiqueta.color}
                bg={etiqueta.bg}
                fullWidth={etiqueta.fullWidth}
                variant={variant}
            />
        ))}
    </div>
));

const pintarList = ({ block, variant }) => (
    <List key={block.key} rows={block.rows} variant={variant} />
);

const pintarIconText = ({ block, variant, onAction }) => block.items.map((item, idx) => (
    <IconText
        key={`${block.key}-${idx}`}
        icon={item.icon}
        value={item.value}
        href={item.href}
        onClick={item.action && onAction ? () => onAction(item.action) : null}
        showDivider={item.showDivider}
        isLast={item.isLast}
        variant={variant}
    />
));

const pintarText = ({ block, variant }) => block.items.map((item, idx) => (
    <Text
        key={`${block.key}-${idx}`}
        label={item.label}
        value={item.value}
        href={item.href}
        variant={variant}
    />
));

const pintarCards = ({ block, variant }) => (
    <Cards key={block.key} cards={block.cards} columns={block.columns} variant={variant} />
);

export const PINTORES = {
    labelGroups: pintarLabelGroups,
    list: pintarList,
    iconText: pintarIconText,
    text: pintarText,
    cards: pintarCards,
};
