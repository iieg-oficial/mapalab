const bagByEventoId = new Map();

const shuffle = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const normalizeFact = (f) => {
    if (!f) return null;
    if (typeof f === 'string') {
        const text = f.trim();
        return text ? { text, symbol: null } : null;
    }
    const text = typeof f.text === 'string' ? f.text.trim() : '';
    if (!text) return null;
    return { text, symbol: f.symbol || null };
};

export const aggregateFactsFromEventos = (eventos) => {
    const list = Array.isArray(eventos) ? eventos : [];
    return list.flatMap((e) => {
        if (!Array.isArray(e?.facts)) return [];
        const fallback = e.funIcon || null;
        return e.facts
            .map((f) => {
                const norm = normalizeFact(f);
                if (!norm) return null;
                return { ...norm, symbol: norm.symbol || fallback };
            })
            .filter(Boolean);
    });
};

export const pickNextFact = (eventoId, facts) => {
    if (!Array.isArray(facts) || facts.length === 0) return null;
    const normalized = facts.map(normalizeFact).filter(Boolean);
    if (normalized.length === 0) return null;

    let bag = bagByEventoId.get(eventoId);
    if (!bag || bag.length === 0) bag = shuffle(normalized);
    const next = bag.pop();
    bagByEventoId.set(eventoId, bag);
    return next;
};
