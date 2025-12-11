import { useState, useCallback } from 'react';

export const useClickPosition = () => {
    const [position, setPosition] = useState(null);

    const updatePosition = useCallback((event) => {
        if (!event) {
            setPosition(null);
            return;
        }

        if (event.pixel) {
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

        const style = {
            position: 'fixed',
            left: `${position.x + offset.x}px`,
            top: `${position.y + offset.y}px`
        };

        const adjustedStyle = { ...style };
        
        if (typeof window !== 'undefined') {
            const maxX = window.innerWidth - 400;
            const maxY = window.innerHeight - 500;

            if (position.x + offset.x > maxX) {
                adjustedStyle.left = `${maxX}px`;
            }

            if (position.y + offset.y > maxY) {
                adjustedStyle.top = `${maxY}px`;
            }

            if (position.x + offset.x < 20) {
                adjustedStyle.left = '20px';
            }

            if (position.y + offset.y < 20) {
                adjustedStyle.top = '20px';
            }
        }

        return adjustedStyle;
    }, [position]);

    return {
        position,
        updatePosition,
        clearPosition,
        getPositionStyle
    };
};