import bgTest from '../../../assets/png/testBG.png';
import PrimaryButton from './PrimaryButton';
import { Link } from 'react-router';

const HeroSection = () => {
    return (
        <section
            className="flex flex-col items-center justify-center gap-12 px-6 py-16 text-center bg-cover bg-center bg-no-repeat relative"
            style={{ backgroundImage: `url(${bgTest})` }}
        >
            <div className="absolute inset-0 bg-white/70"></div>

            <div className="relative z-10 flex flex-col items-center gap-12">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-[#454545] leading-tight">
                    Explora Jalisco en Capas
                </h1>

                <div className="flex flex-col gap-6 w-full max-w-3xl">
                    <div className="bg-[#e2e2e2] h-14 w-full rounded-xl shadow-sm"></div>
                    <div className="bg-[#e2e2e2] h-14 w-full rounded-xl shadow-sm"></div>
                </div>

                <PrimaryButton buttonLabel='Quiero explorar el mapa' buttonSendTo='/mapa'/>
            </div>
        </section>
    );
};

export default HeroSection;
