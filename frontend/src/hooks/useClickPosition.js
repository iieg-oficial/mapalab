import { useState, useCallback } from 'react';

export const useClickPosition = () => {
    const [position, setPosition] = useState(null);

    const updatePosition = useCallback((event) => {
        if (!event) {
            setPosition(null);
            return;
        }

        if (event.originalEvent) {
            setPosition({
                x: event.originalEvent.clientX,
                y: event.originalEvent.clientY
            });
        }
        else if (event.pixel) {
            setPosition({
                x: event.pixel[0],
                y: event.pixel[1]
            });
        }
        else if (event.clientX !== undefined && event.clientY !== undefined) {
            setPosition({
                x: event.clientX,
                y: event.clientY
            });
        }
    }, []);

    const clearPosition = useCallback(() => {
        setPosition(null);
    }, []);

    const getPositionStyle = useCallback((offset = { x: 10, y: 10 }) => {
        if (!position) return {};

        return {
            position: 'fixed',
            left: `${position.x + offset.x}px`,
            top: `${position.y + offset.y}px`
        };
    }, [position]);

    return {
        position,
        updatePosition,
        clearPosition,
        getPositionStyle
    };
};