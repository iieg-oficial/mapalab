const crearVideo = async (lienzo, fps) => {
    const mb = await import('mediabunny');
    const formatos = [new mb.Mp4OutputFormat({ fastStart: 'in-memory' }), new mb.WebMOutputFormat()];
    for (const formato of formatos) {
        const codec = await mb.getFirstEncodableVideoCodec(formato.getSupportedVideoCodecs(), {
            width: lienzo.width,
            height: lienzo.height,
        });
        if (!codec) continue;
        const salida = new mb.Output({ format: formato, target: new mb.BufferTarget() });
        const fuente = new mb.CanvasSource(lienzo, { codec, quality: mb.QUALITY_HIGH });
        salida.addVideoTrack(fuente, { frameRate: fps });
        await salida.start();
        return {
            extension: formato.fileExtension,
            agregar: segundo => fuente.add(segundo, 1 / fps),
            terminar: async () => {
                await salida.finalize();
                return new Blob([salida.target.buffer], { type: formato.mimeType });
            },
            cancelar: () => salida.cancel().catch(() => {}),
        };
    }
    return null;
};

const crearGif = async (lienzo, fps) => {
    const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
    const gif = GIFEncoder();
    const ctx = lienzo.getContext('2d', { willReadFrequently: true });
    const retraso = Math.round(1000 / fps);
    return {
        extension: '.gif',
        agregar: async () => {
            const { data, width, height } = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
            const paleta = quantize(data, 256);
            gif.writeFrame(applyPalette(data, paleta), width, height, { palette: paleta, delay: retraso, repeat: 0 });
        },
        terminar: async () => {
            gif.finish();
            return new Blob([gif.bytes()], { type: 'image/gif' });
        },
        cancelar: () => {},
    };
};

export const crearCodificador = (tipo, lienzo, fps) => (tipo === 'gif' ? crearGif(lienzo, fps) : crearVideo(lienzo, fps));

export const puedeGrabarVideo = () => typeof window !== 'undefined' && 'VideoEncoder' in window;
