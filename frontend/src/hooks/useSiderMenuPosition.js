import { useLayoutEffect, useCallback, useState, useRef } from 'react';
import { useSider } from '@contexts/SiderContext';
import { SIDER_TRANSITION_CSS } from '@constants/sider';

export const useSiderMenuPosition = ({
    open,
    anchorRef,
    contentRef,
    placement = 'right-start',
    offset = 8,
    mobileFullscreen = false,
    treatAsMobile: treatAsMobileProp
}) => {
    const { siderRef, isMobile: contextIsMobile, width: siderWidth } = useSider();
    const isMobile = treatAsMobileProp ?? contextIsMobile;
    const [isReady, setIsReady] = useState(false);
    const updateFrameRef = useRef(null);
    const lastPositionRef = useRef(null);

    const calculatePosition = useCallback(() => {
        const anchor = anchorRef?.current;
        const content = contentRef?.current;
        const sider = siderRef?.current;

        if (!anchor || !content) {
            return null;
        }

        if (isMobile && mobileFullscreen) {
            return { placement: 'fullscreen' };
        }

        if (!sider) {
            return null;
        }

        const anchorRect = anchor.getBoundingClientRect();
        const siderRect = sider.getBoundingClientRect();
        const contentHeight = content.scrollHeight || content.offsetHeight;

        if (isMobile) {
            const top = anchorRect.bottom + offset;
            const availableHeight = window.innerHeight - top - 16;
            const maxTop = window.innerHeight - contentHeight - 16;

            return {
                top: Math.max(16, Math.min(top, maxTop)),
                left: null,
                maxHeight: availableHeight < contentHeight ? availableHeight : null,
                placement: 'bottom-start'
            };
        }

        const siderBottom = siderRect.bottom;
        const siderTop = siderRect.top;

        const placements = {
            'right-start': () => {
                const top = anchorRect.top;
                const left = anchorRect.right + offset;
                const bottom = top + contentHeight;

                if (bottom > siderBottom) {
                    const spaceBelow = siderBottom - anchorRect.top;
                    const spaceAbove = anchorRect.top - siderTop;

                    if (spaceAbove > spaceBelow && spaceAbove >= 200) {
                        const maxHeightValue = spaceAbove - 8;
                        const finalTop = contentHeight <= maxHeightValue
                            ? anchorRect.top - contentHeight
                            : siderTop + 8;

                        return {
                            placement: 'right-end',
                            top: finalTop,
                            left,
                            maxHeight: maxHeightValue
                        };
                    }

                    if (spaceBelow >= 200) {
                        return {
                            placement: 'right-start',
                            top: anchorRect.top,
                            left,
                            maxHeight: spaceBelow - 8
                        };
                    }

                    return {
                        placement: 'right-start',
                        top: siderTop + 8,
                        left,
                        maxHeight: siderBottom - siderTop - 16
                    };
                }

                return {
                    placement: 'right-start',
                    top,
                    left,
                    maxHeight: null
                };
            },
            'right-end': () => {
                const top = anchorRect.bottom - contentHeight;
                const left = anchorRect.right + offset;
                return { placement: 'right-end', top, left, maxHeight: null };
            }
        };

        const compute = placements[placement] || placements['right-start'];
        return compute();
    }, [anchorRef, contentRef, siderRef, placement, offset, isMobile, mobileFullscreen]);

    const updatePosition = useCallback(() => {
        if (updateFrameRef.current) {
            cancelAnimationFrame(updateFrameRef.current);
        }

        if (!open) {
            setIsReady(false);
            lastPositionRef.current = null;
            return;
        }

        const position = calculatePosition();
        const el = contentRef?.current;

        if (!position || !el) return;

        const roundedTop = position.top ? Math.round(position.top) : null;
        const roundedLeft = position.left ? Math.round(position.left) : null;
        const roundedMaxHeight = position.maxHeight ? Math.round(position.maxHeight) : null;
        const positionKey = `${position.placement}-${roundedTop}-${roundedLeft}-${roundedMaxHeight}`;

        if (lastPositionRef.current === positionKey) {
            return;
        }

        lastPositionRef.current = positionKey;
        el.style.transition = SIDER_TRANSITION_CSS;

        if (position.placement === 'fullscreen') {
            el.style.left = '';
            el.style.top = '';
            el.style.maxHeight = '';
            el.style.overflowY = '';
            updateFrameRef.current = requestAnimationFrame(() => {
                setIsReady(true);
            });
            return;
        }

        if (position.left !== null && position.left !== undefined) {
            el.style.left = `${position.left}px`;
        } else {
            el.style.left = '';
        }

        if (position.top !== null && position.top !== undefined) {
            el.style.top = `${position.top}px`;
        } else {
            el.style.top = '';
        }

        if (position.maxHeight) {
            el.style.maxHeight = `${position.maxHeight}px`;
            el.style.overflowY = 'auto';
        } else {
            el.style.maxHeight = '';
            el.style.overflowY = '';
        }

        updateFrameRef.current = requestAnimationFrame(() => {
            setIsReady(true);
        });
    }, [open, calculatePosition]);

    useLayoutEffect(() => {
        if (!open) return;
        lastPositionRef.current = null;
        updatePosition();
    }, [open, siderWidth, anchorRef, updatePosition]);

    useLayoutEffect(() => {
        if (!open || !contentRef?.current) return;

        let debounceTimer = null;
        let isUpdating = false;

        const handleUpdate = () => {
            if (isUpdating) return;

            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }

            debounceTimer = setTimeout(() => {
                if (updateFrameRef.current) {
                    cancelAnimationFrame(updateFrameRef.current);
                }
                isUpdating = true;
                updateFrameRef.current = requestAnimationFrame(() => {
                    updatePosition();
                    isUpdating = false;
                });
            }, 16);
        };

        const resizeObserver = new ResizeObserver(handleUpdate);
        resizeObserver.observe(contentRef.current);

        window.addEventListener('resize', handleUpdate, { passive: true });
        window.addEventListener('scroll', handleUpdate, { passive: true });

        return () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            if (updateFrameRef.current) {
                cancelAnimationFrame(updateFrameRef.current);
            }
            resizeObserver.disconnect();
            window.removeEventListener('resize', handleUpdate);
            window.removeEventListener('scroll', handleUpdate);
        };
    }, [open, contentRef, updatePosition]);

    useLayoutEffect(() => {
        return () => {
            if (updateFrameRef.current) {
                cancelAnimationFrame(updateFrameRef.current);
            }
        };
    }, []);

    return { isReady };
};
