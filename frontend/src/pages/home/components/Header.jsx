import { Link } from 'react-router';
import bannerConfig from '../config/bannerConfig';
import Logo from '../../../components/Logo';

const Header = () => {
    const activeBanner = bannerConfig.banners.find(banner => banner.active) || bannerConfig.banners[0];

    const mobileStyle = {
        background: `linear-gradient(359deg, rgba(92, 36, 114, 0.9) 0%, rgba(150, 60, 186, 0.9) 100%) center center / cover no-repeat`
    };

    const tableStyle = {
        background: `linear-gradient(${activeBanner.gradient.angle}, ${activeBanner.gradient.from}E6 0%, ${activeBanner.gradient.to}E6 100%), url(${activeBanner.image.src})`,
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat'
    };

    const desktopStyle = {
        background: `linear-gradient(${activeBanner.gradient.angle}, ${activeBanner.gradient.from} 0%, ${activeBanner.gradient.to} 100%)`
    };

    return (
        <header className="relative px-4 h-dvh md:h-[90dvh] 2xl:h-[80dvh] min-h-[600px] w-full overflow-visible">
            <div
                className="absolute inset-0 md:hidden"
                style={mobileStyle}
            />
            <div
                className="hidden md:block md:absolute inset-0 xl:hidden"
                style={tableStyle}
            />
            <div
                className="absolute inset-0 hidden xl:block"
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

            <div className="hidden xl:block w-[35vw] absolute right-0 top-[20%] 2xl:top-[12%] 3xl:top-[10%]">
                <img
                    src={activeBanner.image.src}
                    alt={activeBanner.image.alt}
                    className="w-full h-auto 2xl:w-full 2xl:h-auto 3xl:max-w-[723px] 3xl:max-h-[583px] object-cover overflow-visible float-right"
                />
            </div>

            <div className="relative z-10 h-full 2xl:h-[70%] flex flex-col xl:flex-row items-center justify-center xl:justify-start 2xl:gap-36 xl:container xl:mx-auto">
                <div className="hidden 2xl:flex 2xl:w-[20vw] 3xl:w-[25vw] justify-end 2xl:mb-18">
                    <Logo
                        name="mapalab"
                        variant="dark"
                        size="w-[216px] h-[232px]"
                        alt="Logo MapaLab banner desktop"
                        type="square"
                    />
                </div>
                <div className="w-full mt-15 md:mt-0 2xl:w-[35vw] px-4 flex justify-center xl:justify-start">
                    <div className="w-full max-w-[497px] xl:max-w-[600px] xl:pl-40 2xl:pl-0 2xl:max-w-[497] flex flex-col gap-3">
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
                                mt-2 bg-orange rounded-[30px] transition-colors
                                hover:bg-[#E57600] hover:shadow-[0px_6px_6px_#5C247234]
                                font-garet font-medium text-white text-[18px] tracking-normal
                            `}
                        >
                            {activeBanner.content.button.label}
                        </Link>
                    </div>
                </div>                
            </div>
            
        </header>
    );
};

export default Header;
