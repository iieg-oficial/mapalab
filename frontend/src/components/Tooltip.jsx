import { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

const Tooltip = ({
    children,
    content,
    placement = 'top',
    delay = 300,
    disabled = false
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);
    const timeoutRef = useRef(null);

    const updatePosition = () => {
        if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        let top, left;
        const offset = 8; 

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

        if (left < offset) {
            left = offset;
        } else if (left + tooltipRect.width > viewport.width - offset) {
            left = viewport.width - tooltipRect.width - offset;
        }

        if (top < offset) {
            top = triggerRect.bottom + offset;
        } else if (top + tooltipRect.height > viewport.height - offset) {
            top = triggerRect.top - tooltipRect.height - offset;
        }

        setPosition({ top, left });
    };

    useLayoutEffect(() => {
        if (!isVisible) return;

        updatePosition();

        const handleUpdate = () => requestAnimationFrame(updatePosition);
        window.addEventListener('resize', handleUpdate);
        window.addEventListener('scroll', handleUpdate, true);

        return () => {
            window.removeEventListener('resize', handleUpdate);
            window.removeEventListener('scroll', handleUpdate, true);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible, placement]);

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

    const tooltipElement = isVisible ? (
        <div
            ref={tooltipRef}
            role="tooltip"
            className="fixed z-[9999] px-2 py-1 text-xs text-white bg-gray-900  rounded shadow-lg max-w-xs pointer-events-none"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
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
