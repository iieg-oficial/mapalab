import { useView3d } from '@contexts/View3dContext';

const GOTAS = 'repeating-linear-gradient(104deg, transparent 0 22px, rgba(160, 196, 226, 0.55) 22px 23px, transparent 23px 47px)';

const Map3DLluvia = () => {
    const { active, inundacion } = useView3d();
    if (!active || !inundacion.lloviendo) return null;

    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[2] overflow-hidden motion-reduce:hidden">
            <style>{'@keyframes mapa3d-lluvia { from { transform: translate3d(0, -140px, 0); } to { transform: translate3d(-34px, 0, 0); } }'}</style>
            <div className="absolute -inset-40 opacity-70" style={{ backgroundImage: GOTAS, backgroundSize: '47px 140px', animation: 'mapa3d-lluvia 0.35s linear infinite' }} />
            <div className="absolute -inset-40 opacity-40" style={{ backgroundImage: GOTAS, backgroundSize: '61px 190px', animation: 'mapa3d-lluvia 0.5s linear infinite' }} />
            <div className="absolute inset-0 bg-[#5d7187]/10" />
        </div>
    );
};

export default Map3DLluvia;
