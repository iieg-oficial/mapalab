import { useState, useRef, useCallback } from 'react';

export const useTextTemplate = (initialText = '') => {
    const [textTemplate, setTextTemplateState] = useState(initialText);
    const textTemplateRef = useRef(initialText);
    const textFillColorRef = useRef('#111827');
    const textBgColorRef = useRef('');
    const textSizeRef = useRef(1);

    const setTextTemplate = useCallback((value) => {
        const sanitized = value?.trim() ? value : '';
        textTemplateRef.current = sanitized;
        setTextTemplateState(sanitized);
    }, []);

    const setTextFillColor = useCallback((color) => {
        textFillColorRef.current = color || '#111827';
    }, []);

    const setTextBgColor = useCallback((color) => {
        textBgColorRef.current = color || '';
    }, []);

    const setTextSize = useCallback((size) => {
        textSizeRef.current = typeof size === 'number' && size > 0 ? size : 1;
    }, []);

    return {
        textTemplate,
        setTextTemplate,
        textTemplateRef,
        textFillColorRef,
        textBgColorRef,
        textSizeRef,
        setTextFillColor,
        setTextBgColor,
        setTextSize,
    };
};
