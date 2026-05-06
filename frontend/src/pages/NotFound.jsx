import { Link } from 'react-router';
import imgLupa from '@assets/images/img_lupa.svg';
import SEO from '@components/SEO';

const NotFound = () => {
    return (
        <>
            <SEO
                title="Página no encontrada | Mapalab"
                description="La página que buscas no existe en MapaLab del IIEG."
                noindex
            />
            <div className="flex flex-col items-center justify-center min-h-screen text-center px-4" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F7F0FA 100%)' }}>
                <img src={imgLupa} alt="Página no encontrada" className="w-64 md:w-80 mb-8" />
                <h1 className="font-garet font-bold text-[28px]/[40px] md:text-[40px]/[56px] text-[#2E4372] tracking-[0px] mb-8">
                No encontramos la página<br />que estás buscando...
                </h1>
                <Link
                    to="/"
                    className="px-10 py-3 bg-[#703089] text-white rounded-[30px] hover:bg-[#5C2472] hover:shadow-[0_6px_6px_#5C247234] transition font-garet font-bold text-[14px]"
                >
                Regresar al inicio
                </Link>
            </div>
        </>
    );
};

export default NotFound;
