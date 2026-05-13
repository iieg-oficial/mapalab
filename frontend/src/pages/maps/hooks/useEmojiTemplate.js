import { useState, useRef, useEffect, useCallback } from 'react';

const normalize = (input) => {
    if (!input) return null;
    if (typeof input === 'string') {
        const trimmed = input.trim();
        return trimmed ? { kind: 'emoji', value: trimmed } : null;
    }
    if (typeof input === 'object') {
        if (input.kind === 'emoji') {
            const value = (input.value || '').trim();
            return value ? { kind: 'emoji', value, name: input.name, id: input.id } : null;
        }
        if (input.kind === 'svg') {
            return input.value ? { kind: 'svg', value: input.value, name: input.name, id: input.id } : null;
        }
        if (input.kind === 'image') {
            const url = input.imageUrl || input.image_url;
            return url ? { kind: 'image', imageUrl: url, name: input.name, id: input.id } : null;
        }
    }
    return null;
};

export const useEmojiTemplate = (initial = null) => {
    const initialSymbol = normalize(initial);
    const [emojiTemplate, setEmojiTemplateState] = useState(initialSymbol);
    const emojiTemplateRef = useRef(initialSymbol);

    const setEmojiTemplate = useCallback((value) => {
        const sanitized = normalize(value);
        emojiTemplateRef.current = sanitized;
        setEmojiTemplateState(sanitized);
    }, []);

    useEffect(() => {
        emojiTemplateRef.current = emojiTemplate;
    }, [emojiTemplate]);

    return {
        emojiTemplate,
        setEmojiTemplate,
        emojiTemplateRef,
    };
};
