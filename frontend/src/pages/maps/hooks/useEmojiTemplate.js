import { useState, useRef, useEffect, useCallback } from 'react';

export const useEmojiTemplate = (initialEmoji = '') => {
    const [emojiTemplate, setEmojiTemplateState] = useState(initialEmoji);
    const emojiTemplateRef = useRef(initialEmoji);

    const setEmojiTemplate = useCallback((value) => {
        const sanitized = value?.trim() ? value : '';
        emojiTemplateRef.current = sanitized;
        setEmojiTemplateState(sanitized);
    }, []);

    useEffect(() => {
        emojiTemplateRef.current = emojiTemplate?.trim() ? emojiTemplate : '';
    }, [emojiTemplate]);

    return {
        emojiTemplate,
        setEmojiTemplate,
        emojiTemplateRef
    };
};
