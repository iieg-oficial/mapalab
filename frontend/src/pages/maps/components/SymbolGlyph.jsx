const DEFAULT_SYMBOL = { kind: 'emoji', value: '⚽' };

const SymbolGlyph = ({ symbol, size = 18, className = '', ariaLabel }) => {
    const s = symbol || DEFAULT_SYMBOL;
    const label = ariaLabel || s.name || s.value || 'simbolo';

    if (s.kind === 'emoji' && s.value) {
        return (
            <span
                className={`inline-block leading-none select-none ${className}`}
                style={{ fontSize: size, fontFamily: '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif' }}
                aria-label={label}
            >
                {s.value}
            </span>
        );
    }

    if ((s.kind === 'svg' || s.kind === 'image') && s.imageUrl) {
        return (
            <img
                src={s.imageUrl}
                alt={label}
                className={`inline-block object-contain select-none ${className}`}
                style={{ width: size, height: size }}
                draggable={false}
            />
        );
    }

    return (
        <span
            className={`inline-block leading-none select-none ${className}`}
            style={{ fontSize: size }}
            aria-label="balón"
        >
            ⚽
        </span>
    );
};

export default SymbolGlyph;
