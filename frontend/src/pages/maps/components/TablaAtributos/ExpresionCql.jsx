import { useEffect, useState } from 'react';

const ExpresionCql = ({ cql, expresionPropia, error, onFijar, onCerrar }) => {
    const [borrador, setBorrador] = useState(expresionPropia || cql || '');

    useEffect(() => {
        setBorrador(expresionPropia || cql || '');
    }, [cql, expresionPropia]);

    const aplicar = () => {
        const limpio = borrador.trim();
        onFijar(limpio || null);
    };

    return (
        <div className="px-3 py-2 flex flex-col gap-1.5 bg-[#F5F7FC] border-b border-[#DCE3F0]">
            <div className="flex items-center gap-2">
                <textarea
                    value={borrador}
                    onChange={event => setBorrador(event.target.value)}
                    rows={2}
                    spellCheck={false}
                    aria-label="Expresión CQL"
                    className="flex-1 px-2 py-1 rounded border border-[#DCE3F0] bg-white text-[11px] font-mono text-graphite resize-none focus:outline-none focus:border-purple"
                />
                <div className="flex flex-col gap-1">
                    <button
                        type="button"
                        onClick={aplicar}
                        className="h-6 px-2.5 rounded border border-purple-deep text-[11px] font-garet text-purple hover:bg-purple-soft cursor-pointer"
                    >
                        Aplicar
                    </button>
                    <button
                        type="button"
                        onClick={onCerrar}
                        className="h-6 px-2.5 rounded text-[11px] font-garet text-[#8A94A6] hover:text-purple cursor-pointer"
                    >
                        Ocultar
                    </button>
                </div>
            </div>
            {error
                ? <span className="text-[11px] font-garet text-[#C0392B]">{error}</span>
                : (
                    <span className="text-[11px] font-garet text-[#8A94A6]">
                        {expresionPropia
                            ? 'Editada a mano: los filtros por columna quedan en un solo chip hasta que la quites.'
                            : 'Es la expresión que arman los filtros de arriba. Si la editas, pasa a ser tuya.'}
                    </span>
                )}
        </div>
    );
};

export default ExpresionCql;
