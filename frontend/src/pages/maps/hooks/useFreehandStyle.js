import { useState, useRef, useCallback } from 'react';
import { DRAW_COLORS } from '../helpers/drawingConstants';

export const useFreehandStyle = (initialColor = DRAW_COLORS.pink, initialWidth = 3) => {
    const [freehandColor, setFreehandColorState] = useState(initialColor);
    const [freehandWidth, setFreehandWidthState] = useState(initialWidth);
    const freehandColorRef = useRef(initialColor);
    const freehandWidthRef = useRef(initialWidth);

    const setFreehandColor = useCallback((color) => {
        freehandColorRef.current = color;
        setFreehandColorState(color);
    }, []);

    const setFreehandWidth = useCallback((width) => {
        freehandWidthRef.current = width;
        setFreehandWidthState(width);
    }, []);

    return {
        freehandColor,
        freehandWidth,
        freehandColorRef,
        freehandWidthRef,
        setFreehandColor,
        setFreehandWidth,
    };
};
