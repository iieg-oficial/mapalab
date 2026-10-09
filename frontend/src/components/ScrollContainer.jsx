import { Children } from 'react';
import { useScrollEdges } from 'scroll-edges/react';
import { HIDDEN_SCROLLBAR } from '@constants/global';
import Icon from '@components/Icon';

const LABELS = { top: 'Ir al inicio', bottom: 'Ir al final' };

const ScrollArrow = ({ edge, arrowProps }) => {
    const icon = <Icon name="downArrow" className={`w-3 h-3 ${edge === 'top' ? 'rotate-180' : ''}`} />;

    if (!arrowProps.onClick) {
        return (
            <span {...arrowProps} className="animate-[bounce_4s_ease-in-out_infinite]">
                {icon}
            </span>
        );
    }

    return (
        <button
            {...arrowProps}
            className="p-1 rounded-full border border-transparent transition-colors cursor-pointer animate-[bounce_4s_ease-in-out_infinite] hover:border-[#70308A] hover:bg-white/70"
        >
            {icon}
        </button>
    );
};

const Fade = ({ edge, color }) => (
    <div
        className={`absolute left-0 right-0 h-8 ${edge === 'top' ? 'top-0' : 'bottom-0'}`}
        style={{ background: `linear-gradient(to ${edge === 'top' ? 'bottom' : 'top'}, ${color}, transparent)` }}
    />
);

const ScrollContainer = ({
    children,
    className = '',
    showMask = true,
    overlayFade = false,
    overlayColor = '#F9FBFF',
    hideScrollbar = true,
    as: Component = 'div',
    clickableArrows = false,
    minItemsForClick = 0,
    itemCount,
    ...props
}) => {
    const items = itemCount != null ? itemCount : Children.count(children);
    const { state, getContainerProps, getAnchorProps, getArrowProps } = useScrollEdges({
        mask: showMask && !overlayFade,
        jump: clickableArrows && { items, min: minItemsForClick },
        labels: LABELS
    });

    const renderEdge = (edge) => state[edge] && (
        <>
            {overlayFade && (
                <div {...getAnchorProps(edge)} className="z-[3]">
                    <Fade edge={edge} color={overlayColor} />
                </div>
            )}
            <div {...getAnchorProps(edge)} className="z-10">
                <div className={`absolute left-0 right-0 flex justify-center ${edge === 'top' ? 'top-2' : 'bottom-2'}`}>
                    <ScrollArrow edge={edge} arrowProps={getArrowProps(edge)} />
                </div>
            </div>
        </>
    );

    return (
        <Component
            {...getContainerProps({
                ...props,
                className: ['relative', hideScrollbar ? HIDDEN_SCROLLBAR : 'overflow-y-auto', className].join(' ')
            })}
        >
            {renderEdge('top')}
            {children}
            {renderEdge('bottom')}
        </Component>
    );
};

export default ScrollContainer;
