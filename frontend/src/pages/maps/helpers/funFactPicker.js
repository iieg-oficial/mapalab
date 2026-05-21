const bagByEventoId = new Map();

const shuffle = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

export const pickNextFact = (eventoId, facts) => {
    if (!Array.isArray(facts) || facts.length === 0) return null;
    let bag = bagByEventoId.get(eventoId);
    if (!bag || bag.length === 0) bag = shuffle(facts);
    const next = bag.pop();
    bagByEventoId.set(eventoId, bag);
    return next;
};

export const resetFactBag = (eventoId) => {
    bagByEventoId.delete(eventoId);
};
