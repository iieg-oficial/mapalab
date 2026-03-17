import Tooltip from '@components/Tooltip';
import { externalIcons } from '@assets/icons';

const MODES = [
    { key: 'auto', tooltip: 'Automático', icon: 'right_arrow_fill_normal' },
    { key: 'expanded', tooltip: 'Expandido fijo', icon: 'left_arrow_fill_normal' },
    { key: 'collapsed', tooltip: 'Colapsado iconos', icon: 'right_arrow_fill_normal' },
    { key: 'zen', tooltip: 'Modo zen', icon: 'down_arrow_fill_normal' },
];

const SiderModeButton = ({ lockMode, onToggle }) => {
    const current = MODES.find(m => m.key === lockMode) || MODES[0];

    return (
        <Tooltip content={current.tooltip} placement="right">
            <button
                onClick={onToggle}
                className="cursor-pointer size-auto transition-all duration-200 "
            >
                <img src={externalIcons[current.icon]} alt={current.tooltip} className="size-10" />
            </button>
        </Tooltip>
    );
};

export default SiderModeButton;
