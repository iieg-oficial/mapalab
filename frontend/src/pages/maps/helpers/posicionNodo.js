export const MOVIMIENTO = 'transition-[left,right,top,bottom] duration-150 motion-reduce:transition-none';

export const UBICACION_PILDORA = {
    vertical: {
        A: 'top-1/2 -translate-y-1/2 right-[calc(50%+42px)] group-data-[nodo=true]/barra:right-[calc(50%+62px)]',
        B: 'top-1/2 -translate-y-1/2 left-[calc(50%+42px)] group-data-[nodo=true]/barra:left-[calc(50%+62px)]',
    },
    horizontal: {
        A: 'left-1/2 -translate-x-1/2 bottom-[calc(50%+42px)] group-data-[nodo=true]/barra:bottom-[calc(50%+64px)]',
        B: 'left-1/2 -translate-x-1/2 top-[calc(50%+42px)] group-data-[nodo=true]/barra:top-[calc(50%+64px)]',
    },
};

export const UBICACION_BOTONES = {
    vertical: 'flex-col pt-2.5 left-1/2 -translate-x-1/2 top-[calc(50%+30px)]',
    horizontal: 'flex-row pl-2.5 top-1/2 -translate-y-1/2 left-[calc(50%+38px)]',
};

export const ubicacionAncla = (orientacion, posicion) => {
    const despues = posicion <= 0.5;
    if (orientacion === 'horizontal') return despues ? 'left-[calc(50%+46px)] top-[calc(50%+24px)]' : 'left-[calc(50%+46px)] bottom-[calc(50%+24px)]';
    return despues ? 'top-[calc(50%+40px)] left-[calc(50%+24px)]' : 'top-[calc(50%+40px)] right-[calc(50%+24px)]';
};
