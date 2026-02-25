import { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@components/Icon';

const variantStyles = {
    normal: {
        className: 'bg-gray-900 text-white border-gray-900',
        arrowColor: '#111827'
    },
    info: {
        className: 'bg-blue-600 text-white border-blue-600',
        arrowColor: '#2563eb'
    },
    warning: {
        className: 'bg-[#FFDDBA] border-[#EF8B10] text-[#FF8300]',
        arrowColor: '#FFDDBA',
        arrowBorderColor: '#EF8B10'
    },
    error: {
        className: 'bg-red-600 text-white border-red-600',
        arrowColor: '#dc2626'
    },
    success: {
        className: 'bg-green-600 text-white border-green-600',
        arrowColor: '#16a34a'
    }
};

const variantIcons = {
    normal: null,
    info: 'info',
    warning: 'info_warning',
    error: 'alert',
    success: 'check'
};

const Tooltip = ({
    children,
    content,
    placement = 'top',
    delay = 300,
    disabled = false,
    icon = null,
    variant = 'normal',
    showArrow = true,
    forceVisible = false
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const shown = isVisible || forceVisible;
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [actualPlacement, setActualPlacement] = useState(placement);
    const [arrowOffset, setArrowOffset] = useState(0);
    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);
    const timeoutRef = useRef(null);

    const variantConfig = variantStyles[variant] || variantStyles.normal;
    const displayIcon = icon !== null ? icon : variantIcons[variant];

    const updatePosition = () => {
        if (!shown || !triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        let top, left;
        const offset = 10;
        let currentPlacement = placement;

        switch (placement) {
        case 'top':
            top = triggerRect.top - tooltipRect.height - offset;
            left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
            break;
        case 'bottom':
            top = triggerRect.bottom + offset;
            left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
            break;
        case 'left':
            top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
            left = triggerRect.left - tooltipRect.width - offset;
            break;
        case 'right':
            top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
            left = triggerRect.right + offset;
            break;
        default:
            top = triggerRect.top - tooltipRect.height - offset;
            left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        }

        const triggerCenterX = triggerRect.left + triggerRect.width / 2;
        const triggerCenterY = triggerRect.top + triggerRect.height / 2;
        let arrowOffsetValue = 0;

        if (left < offset) {
            left = offset;
            arrowOffsetValue = triggerCenterX - (left + tooltipRect.width / 2);
        } else if (left + tooltipRect.width > viewport.width - offset) {
            left = viewport.width - tooltipRect.width - offset;
            arrowOffsetValue = triggerCenterX - (left + tooltipRect.width / 2);
        }

        if (top < offset) {
            top = triggerRect.bottom + offset;
            currentPlacement = 'bottom';
            if (placement === 'left' || placement === 'right') {
                arrowOffsetValue = triggerCenterY - (top + tooltipRect.height / 2);
            }
        } else if (top + tooltipRect.height > viewport.height - offset) {
            top = triggerRect.top - tooltipRect.height - offset;
            currentPlacement = 'top';
            if (placement === 'left' || placement === 'right') {
                arrowOffsetValue = triggerCenterY - (top + tooltipRect.height / 2);
            }
        }

        setPosition({ top, left });
        setActualPlacement(currentPlacement);
        setArrowOffset(arrowOffsetValue);
    };

    useLayoutEffect(() => {
        if (!shown) return;

        updatePosition();

        const handleUpdate = () => requestAnimationFrame(updatePosition);
        window.addEventListener('resize', handleUpdate);
        window.addEventListener('scroll', handleUpdate, true);

        return () => {
            window.removeEventListener('resize', handleUpdate);
            window.removeEventListener('scroll', handleUpdate, true);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shown, placement]);

    const handleMouseEnter = () => {
        if (disabled || !content) return;

        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    if (!content || disabled) {
        return children;
    }

    const getArrowStyles = () => {
        const arrowSize = 8;
        const hasBorder = !!variantConfig.arrowBorderColor;
        const borderColor = variantConfig.arrowBorderColor || variantConfig.arrowColor;
        const fillColor = variantConfig.arrowColor;

        const baseStyles = {
            position: 'absolute',
            width: 0,
            height: 0,
            borderStyle: 'solid',
        };

        const getPositionStyles = (size, color, isBorder = false) => {
            const offset = isBorder ? 0 : 1;

            switch (actualPlacement) {
            case 'top':
                return {
                    ...baseStyles,
                    bottom: isBorder ? -size : -(size - offset),
                    left: `calc(50% + ${arrowOffset}px)`,
                    transform: 'translateX(-50%)',
                    borderWidth: `${size}px ${size}px 0 ${size}px`,
                    borderColor: `${color} transparent transparent transparent`,
                };
            case 'bottom':
                return {
                    ...baseStyles,
                    top: isBorder ? -size : -(size - offset),
                    left: `calc(50% + ${arrowOffset}px)`,
                    transform: 'translateX(-50%)',
                    borderWidth: `0 ${size}px ${size}px ${size}px`,
                    borderColor: `transparent transparent ${color} transparent`,
                };
            case 'left':
                return {
                    ...baseStyles,
                    right: isBorder ? -size : -(size - offset),
                    top: `calc(50% + ${arrowOffset}px)`,
                    transform: 'translateY(-50%)',
                    borderWidth: `${size}px 0 ${size}px ${size}px`,
                    borderColor: `transparent transparent transparent ${color}`,
                };
            case 'right':
                return {
                    ...baseStyles,
                    left: isBorder ? -size : -(size - offset),
                    top: `calc(50% + ${arrowOffset}px)`,
                    transform: 'translateY(-50%)',
                    borderWidth: `${size}px ${size}px ${size}px 0`,
                    borderColor: `transparent ${color} transparent transparent`,
                };
            default:
                return baseStyles;
            }
        };

        if (hasBorder) {
            return {
                border: getPositionStyles(arrowSize, borderColor, true),
                fill: { ...getPositionStyles(arrowSize - 1, fillColor, false), zIndex: 1 }
            };
        }

        return {
            border: null,
            fill: getPositionStyles(arrowSize, fillColor, true)
        };
    };

    const tooltipElement = shown ? (
        <div
            ref={tooltipRef}
            role="tooltip"
            className={`
                fixed z-[9999] px-2.5 py-1 text-[10px]/[12px] font-medium font-garet rounded-[12px] 
                max-w-xs pointer-events-none flex items-center gap-1.5 border tracking-normal
                ${variantConfig.className}
            `}
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            {showArrow && (() => {
                const arrowStyles = getArrowStyles();
                return (
                    <>
                        {arrowStyles.border && <div style={arrowStyles.border} />}
                        <div style={arrowStyles.fill} />
                    </>
                );
            })()}
            {displayIcon && <Icon name={displayIcon} className="size-6 flex-shrink-0" />}
            {content}
        </div>
    ) : null;

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ display: 'inline-block' }}
            >
                {children}
            </div>
            {tooltipElement && createPortal(tooltipElement, document.body)}
        </>
    );
};

export default Tooltip;

