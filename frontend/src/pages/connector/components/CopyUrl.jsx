import { useEffect, useRef, useState } from 'react';

const COPY_FEEDBACK_MS = 2000;

const CopyUrl = ({ url }) => {
    const [copied, setCopied] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
        } catch {
            window.prompt('Selecciona y copia esta URL:', url);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-[720px]">
            <code className="flex-1 min-w-0 truncate bg-white text-purple-deep rounded-full px-5 py-3 shadow-[0_3px_24px_#1A26641A] font-mono text-[15px]">
                {url}
            </code>
            <button
                type="button"
                onClick={handleCopy}
                className="rounded-full bg-purple text-white font-garet font-bold px-6 py-3 hover:bg-purple-deep focus-visible:ring-2 focus-visible:ring-purple-deep focus-visible:ring-offset-2 outline-none transition-colors cursor-pointer"
            >
                <span aria-live="polite">{copied ? 'Copiada' : 'Copiar URL'}</span>
            </button>
        </div>
    );
};

export default CopyUrl;
