import polygonClipping from 'polygon-clipping';

const areaAnillo = (anillo) => {
    let doble = 0;
    for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i, i += 1) {
        doble += (anillo[j][0] + anillo[i][0]) * (anillo[j][1] - anillo[i][1]);
    }
    return Math.abs(doble) / 2;
};

export const areaMultipoligono = (multi = []) => multi.reduce(
    (total, [exterior = [], ...huecos]) => total + areaAnillo(exterior) - huecos.reduce((suma, hueco) => suma + areaAnillo(hueco), 0),
    0,
);

const comoMultipoligono = (geometria) => {
    if (geometria?.type === 'Polygon') return [geometria.coordinates];
    if (geometria?.type === 'MultiPolygon') return geometria.coordinates;
    return [];
};

export const fraccionDentro = (geometria, seleccion) => {
    const multi = comoMultipoligono(geometria);
    const total = areaMultipoligono(multi);
    if (!total) return 0;
    const dentro = areaMultipoligono(polygonClipping.intersection(multi, seleccion));
    return Math.min(1, dentro / total);
};

export const sumaPorFraccion = (features, campo, seleccion) => features.reduce((acumulado, feature) => {
    const bruto = feature?.properties?.[campo];
    const valor = bruto == null || bruto === '' ? NaN : Number(bruto);
    if (!Number.isFinite(valor) || !feature.geometry) return acumulado;
    const fraccion = fraccionDentro(feature.geometry, seleccion);
    if (fraccion <= 0) return acumulado;
    return { suma: acumulado.suma + valor * fraccion, elementos: acumulado.elementos + 1 };
}, { suma: 0, elementos: 0 });
