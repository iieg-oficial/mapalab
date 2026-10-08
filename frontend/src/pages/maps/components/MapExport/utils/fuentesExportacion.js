const PESOS_GARET = [300, 400, 500, 700];

export const cargarFuentesDeExportacion = async (fuentes = document.fonts) => {
    if (!fuentes?.load) return;
    await Promise.all(PESOS_GARET.map(peso => fuentes.load(`${peso} 16px Garet`).catch(() => [])));
    await fuentes.ready;
};
