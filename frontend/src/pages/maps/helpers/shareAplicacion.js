let aplicadoEn = 0;

export const marcarShareAplicado = () => {
    aplicadoEn = Date.now();
};

export const shareAplicadoHace = () => Date.now() - aplicadoEn;
