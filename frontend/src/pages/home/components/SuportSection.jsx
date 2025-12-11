import { Link } from 'react-router';

const SuportSection = () => {
    return (
        <div className="flex flex-wrap justify-center gap-6 sm:gap-8 md:gap-12 mt-20 mb-10 text-center">
            <Link href="/documentation" className="bg-[#f5f5f5] py-6 sm:py-8 px-10 sm:px-16 md:px-24 flex items-center justify-center rounded-xl min-w-[180px] md:min-w-[220px]">
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-[#454545]">
                    Documentación
                </h2>
            </Link>
            <Link href="/faq" className="bg-[#f5f5f5] py-6 sm:py-8 px-10 sm:px-16 md:px-24 flex items-center justify-center rounded-xl min-w-[180px] md:min-w-[220px]">
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-[#454545]">
                    Preguntas frecuentes
                </h2>
            </Link>
        </div>
    );
}

export default SuportSection;
