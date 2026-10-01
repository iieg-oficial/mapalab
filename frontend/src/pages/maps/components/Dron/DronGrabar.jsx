import { useState } from 'react';
import Segmented from '@components/Segmented';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { useFormatosVideo } from '@hooksMaps/useFormatosVideo';
import { elegible, opcionesDeArchivo } from '@pages/maps/helpers/grabacion/opcionesArchivo';
import { reloj } from '@pages/maps/helpers/grabacion/planVuelo';

const CAMARAS = [
    { value: 'primera', label: '1ª persona', tooltip: 'Desde la cabina' },
    { value: 'tercera', label: '3ª persona', tooltip: 'Detrás del dron' },
    { value: 'cono', label: 'Cono', tooltip: 'La cámara del cono, mirando al suelo como un dron de mapeo' },
];

export const ContadorRec = ({ segundos, tope }) => (
    <span className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#D6336C] px-2.5 py-1 font-garet text-[11px] font-extrabold tracking-[0.06em] text-white tabular-nums shadow-[0_2px_8px_#221A2E40]" role="status">
        <i className="size-1.5 rounded-full bg-white motion-safe:animate-pulse" />
        REC {reloj(segundos)} / {reloj(tope)}
    </span>
);

export const TarjetaGrabar = ({ tope, error, onGrabar, onPng, onCerrar }) => {
    const soporte = useFormatosVideo();
    const opciones = opcionesDeArchivo(soporte, { gif: false, video: 'El vuelo en tiempo real' });
    const [camara, setCamara] = useState('tercera');
    const [elegido, setContenedor] = useState('mp4');
    const contenedor = elegible(opciones, elegido);
    const sinVideo = opciones.every(o => o.disabled);

    return (
        <div className="absolute right-10 top-1.5 z-10 flex w-[300px] flex-col gap-2.5 rounded-[12px] bg-[#F9FBFF] p-3 shadow-[0_5px_20px_#1A26641A]" role="dialog" aria-label="Grabar el vuelo">
            <div className="flex items-center justify-between">
                <span className="font-garet text-[13px] font-bold text-[#5C2472]">Grabar el vuelo</span>
                <MobileSheetCloseButton onClick={onCerrar} />
            </div>
            <Segmented variant="panel" ariaLabel="Cámara" options={CAMARAS} value={camara} onChange={setCamara} />
            <Segmented variant="panel" ariaLabel="Formato del video" options={opciones} value={contenedor} onChange={setContenedor} />
            <button
                type="button"
                onClick={() => onGrabar(camara, contenedor)}
                disabled={sinVideo}
                className="h-9 w-full rounded-[30px] bg-[#D6336C] font-garet text-[13px] font-bold text-white hover:shadow-[0_6px_6px_#D6336C34] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
                Grabar hasta {reloj(tope)}
            </button>
            <button type="button" onClick={onPng} className="self-center font-garet text-[12px] font-bold text-[#5C2472] underline cursor-pointer">
                Descargar la imagen PNG del recorrido
            </button>
            {error && <p className="font-garet text-[11.5px] text-[#D6336C]">{error}</p>}
        </div>
    );
};
