import logoMapalabShort from '@logos/mapalab_short.svg';

export const QR_DESCARGA = 800;

export const opcionesQr = (url, size) => ({
    width: size,
    height: size,
    type: 'canvas',
    data: url,
    image: logoMapalabShort,
    margin: 4,
    qrOptions: { errorCorrectionLevel: 'H' },
    imageOptions: { margin: 4, imageSize: 0.35, hideBackgroundDots: true },
    dotsOptions: { type: 'rounded', color: '#5C2472' },
    cornersSquareOptions: { type: 'extra-rounded', color: '#703088' },
    backgroundOptions: { color: '#FFFFFF' },
});

export const cargarQr = () => import('qr-code-styling').then((modulo) => modulo.default);

export const descargarQr = async (url, nombre) => {
    const QRCodeStyling = await cargarQr();
    const grande = new QRCodeStyling(opcionesQr(url, QR_DESCARGA));
    await grande.download({ name: nombre, extension: 'png' });
};
