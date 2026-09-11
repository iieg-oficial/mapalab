const BOLD_SPLIT = /(\*\*[^*]+\*\*)/;

export const renderInlineBold = (text) => {
    if (typeof text !== 'string' || !text.includes('**')) return text;
    return text.split(BOLD_SPLIT).map((part, idx) => (
        part.startsWith('**') && part.endsWith('**') && part.length > 4
            ? <strong key={idx} className="font-bold">{part.slice(2, -2)}</strong>
            : part
    ));
};
