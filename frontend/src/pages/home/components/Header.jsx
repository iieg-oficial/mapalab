import { Link } from 'react-router';
import bannerConfig from '../config/bannerConfig';

const Header = () => {
    const activeBanner = bannerConfig.banners.find(banner => banner.active) || bannerConfig.banners[0];

    const gradientStyle = {
        background: `transparent linear-gradient(${activeBanner.gradient.angle}, ${activeBanner.gradient.from} 0%, ${activeBanner.gradient.to} 100%) 0% 0% no-repeat padding-box`
    };

    return (
        <header
            className="h-[80vh] min-h-[500px] w-full overflow-visible"
            style={gradientStyle}
        >
            <div className="h-full max-w-[1600px] mx-auto flex items-start pt-16 justify-between px-[5%] gap-8 overflow-visible">
                <div className="flex-1 flex justify-center items-start pt-8">
                    <div className="w-40 h-40 md:w-52 md:h-52 lg:w-64 lg:h-64 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden">
                        <img
                            src={activeBanner.logo.src}
                            alt={activeBanner.logo.alt}
                            className="w-full h-full object-contain p-4"
                        />
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-start gap-6 text-center pt-8">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white">
                        <span className="font-bold font-garetbold">{activeBanner.content.titleHighlight}</span>
                        {' '}
                        <span className="font-light font-garetlight">{activeBanner.content.titleRest}</span>
                    </h1>
                    <p className="text-base md:text-lg lg:text-xl text-white/90 max-w-md">
                        {activeBanner.content.description}
                    </p>
                    <Link
                        to={activeBanner.content.button.link}
                        className="mt-4 px-8 py-3 bg-white text-[#5C2472] font-semibold rounded-xl hover:bg-white/90 transition-colors text-lg"
                    >
                        {activeBanner.content.button.label}
                    </Link>
                </div>

                <div className="flex-1 h-[120%] flex justify-end items-start overflow-visible">
                    <img
                        src={activeBanner.image.src}
                        alt={activeBanner.image.alt}
                        className="h-full w-auto max-w-none object-contain"
                    />
                </div>
            </div>
        </header>
    );
};

export default Header;
