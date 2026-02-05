import footerConfig from '../config/footerConfig';

const Footer = () => {
    return (
        <footer className="bg-[#5C2472] p-10">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-y-10 xl:my-[54px]">
                {footerConfig.logos.map((logo) => (
                    <div key={logo.id} className="flex items-center justify-center">
                        <img
                            src={logo.src}
                            alt={logo.name}
                            style={{ width: logo.width, height: logo.height }}
                            className="object-contain"
                        />
                    </div>
                ))}
            </div>
            <p className="font-garet font-medium text-[19px]/[28px] text-[#C09ED5] text-center tracking-normal">
                {footerConfig.copyright}
            </p>
        </footer>
    );
};

export default Footer;