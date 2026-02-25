import { Link } from 'react-router';
import bannerConfig from '../config/bannerConfig';
import Logo from '../../../components/Logo';

const Header = () => {
    const activeBanner = bannerConfig.banners.find(banner => banner.active) || bannerConfig.banners[0];

    const mobileStyle = {
        background: `linear-gradient(${activeBanner.gradient.angle}, ${activeBanner.gradient.from}E6 0%, ${activeBanner.gradient.to}E6 100%), url(${activeBanner.image.src})`,
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat'
    };

    const desktopStyle = {
        background: `linear-gradient(${activeBanner.gradient.angle}, ${activeBanner.gradient.from} 0%, ${activeBanner.gradient.to} 100%)`
    };

    return (
        <header className="relative h-[90vh] 2xl:h-[80vh] min-h-[500px] w-full overflow-visible">
            <div
                className="absolute inset-0 2xl:hidden"
                style={mobileStyle}
            />
            <div
                className="absolute inset-0 hidden 2xl:block"
                style={desktopStyle}
            />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 2xl:hidden z-10">
                <Logo
                    name="mapalab"
                    variant="dark"
                    size="w-80 h-25"
                    alt="Logo MapaLab banner mobile"
                    expanded
                />
            </div>

            <div className="relative z-10 h-full 2xl:h-[70%] flex flex-col 2xl:flex-row items-center justify-center 2xl:justify-start 2xl:gap-36">
                <div className="hidden 2xl:flex 2xl:w-[35vw] justify-end 2xl:mb-18">
                    <Logo
                        name="mapalab"
                        variant="dark"
                        size="w-[216px] h-[232px]"
                        alt="Logo MapaLab banner desktop"
                        type="square"
                    />
                </div>
                <div className="w-full mt-15 md:mt-0 2xl:w-[35vw] px-4 flex justify-center">
                    <div className="w-full max-w-[497px] flex flex-col items-start justify-start gap-3">
                        <h1 className="font-garet text-[50px]/[59px] text-white tracking-normal text-left">
                            <span className="block font-medium tracking-normal">{activeBanner.content.titleHighlight}</span>
                            <span className="block font-extrabold tracking-normal">{activeBanner.content.titleRest}</span>
                        </h1>
                        <p className="font-garet font-medium text-white text-[21px]/[34px] tracking-normal text-left">
                            {activeBanner.content.description}
                        </p>
                        <Link
                            to={activeBanner.content.button.link}
                            className={`
                                flex items-center justify-center h-[54px] w-full max-w-[410px]
                                mt-2 bg-[#FF8300] rounded-[30px] transition-colors
                                hover:bg-[#E57600] hover:shadow-[0px_6px_6px_#5C247234]
                                font-garet font-medium text-white text-[16px] tracking-normal
                            `}
                        >
                            {activeBanner.content.button.label}
                        </Link>
                    </div>
                </div>
                <div className="hidden 2xl:block w-[35vw]">
                    <img
                        src={activeBanner.image.src}
                        alt={activeBanner.image.alt}
                        className="w-[723px] h-[583px] object-cover overflow-visible"
                    />
                </div>
            </div>
        </header>
    );
};

export default Header;
