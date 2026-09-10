import SiderModeButton from './SiderModeButton';
import CatalogoSiderButton from './CatalogoSiderButton';
import EventoFunButton from './EventoFunButton';

const SiderEdgeButtons = ({ layout, lockMode, isExpanded, onToggle, onSelect, funEvento }) => {
    const modeButton = <SiderModeButton lockMode={lockMode} isExpanded={isExpanded} onToggle={onToggle} onSelect={onSelect} />;
    const funButton = funEvento && (
        <EventoFunButton evento={funEvento} sizeClass="size-5" iconSize={12} avisoPlacement={layout === 'row' ? 'bottom' : 'right'} />
    );

    if (layout === 'row') {
        return (
            <div data-sider-nohover className="absolute right-0 bottom-0 translate-x-2.5 translate-y-1/2 z-10 flex flex-row-reverse items-center gap-1">
                {modeButton}
                {funButton}
                <CatalogoSiderButton tooltipPlacement="bottom" />
            </div>
        );
    }

    return (
        <div data-sider-nohover className="absolute right-0 top-full translate-x-1/2 -translate-y-2.5 z-10 flex flex-col items-center gap-1">
            {modeButton}
            {funButton}
            <CatalogoSiderButton />
        </div>
    );
};

export default SiderEdgeButtons;
