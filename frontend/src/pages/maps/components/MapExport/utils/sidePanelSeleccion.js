const TEXTO = '#465055';
const MORADO = '#5C2472';

const crearFila = ({ etiqueta, valor, detalle }) => {
    const fila = document.createElement('div');
    Object.assign(fila.style, {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: '16px',
        marginTop: '10px',
        fontFamily: 'Garet, system-ui, sans-serif',
        fontSize: '15px',
        color: TEXTO,
    });

    const nombre = document.createElement('span');
    nombre.textContent = etiqueta;

    const derecha = document.createElement('span');
    Object.assign(derecha.style, { fontWeight: '700', whiteSpace: 'nowrap' });
    derecha.textContent = valor;

    if (detalle) {
        const nota = document.createElement('span');
        Object.assign(nota.style, { fontWeight: '400', fontSize: '13px', color: '#6E7477', marginLeft: '8px' });
        nota.textContent = detalle;
        derecha.appendChild(nota);
    }

    fila.appendChild(nombre);
    fila.appendChild(derecha);
    return fila;
};

export const createSidePanelSeleccion = (filas, contentWidth, sectionMargin, sectionRadius) => {
    if (!filas || filas.length === 0) return null;

    const seccion = document.createElement('div');
    Object.assign(seccion.style, {
        width: `${contentWidth}px`,
        padding: '20px 40px 24px',
        margin: sectionMargin,
        backgroundColor: '#F7F8FC',
        borderRadius: sectionRadius,
        boxSizing: 'border-box',
    });

    const titulo = document.createElement('div');
    Object.assign(titulo.style, {
        fontFamily: 'Garet, system-ui, sans-serif',
        fontSize: '18px',
        fontWeight: '700',
        color: MORADO,
    });
    titulo.textContent = 'Selección';
    seccion.appendChild(titulo);

    filas.forEach(fila => seccion.appendChild(crearFila(fila)));
    return seccion;
};
