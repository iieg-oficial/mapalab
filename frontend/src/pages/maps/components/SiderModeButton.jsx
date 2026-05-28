import FloatingIconButton from '@components/FloatingIconButton';

const MODES = [
    { key: 'auto', tooltip: 'Automático', icon: 'right_arrow_fill_normal' },
    { key: 'expanded', tooltip: 'Expandido fijo', icon: 'left_arrow_fill_normal' },
    { key: 'collapsed', tooltip: 'Colapsado iconos', icon: 'right_arrow_fill_normal' },
    { key: 'mobile', tooltip: 'Modo mobile', icon: 'down_arrow_fill_normal' },
];

const SiderModeButton = ({ lockMode, onToggle }) => {
    const current = MODES.find(m => m.key === lockMode) || MODES[0];
    return (
        <FloatingIconButton
            iconKey={current.icon}
            tooltip={current.tooltip}
            placement="right"
            onClick={onToggle}
        />
    );
};

export default SiderModeButton;
