import { useState, useRef, useEffect, useCallback } from 'react';

export const useTextTemplate = (initialText = '') => {
    const [textTemplate, setTextTemplateState] = useState(initialText);
    const textTemplateRef = useRef(initialText);

    const setTextTemplate = useCallback((value) => {
        const sanitized = value?.trim() ? value : '';
        textTemplateRef.current = sanitized;
        setTextTemplateState(sanitized);
    }, []);

    useEffect(() => {
        textTemplateRef.current = textTemplate?.trim() ? textTemplate : '';
    }, [textTemplate]);

    return {
        textTemplate,
        setTextTemplate,
        textTemplateRef
    };
};
