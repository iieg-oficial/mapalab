import footerConfig from '../config/footerConfig';

const Footer = () => {
    return (
        <footer className="bg-[#5C2472] p-10">
            <div className="flex flex-col xl:flex-row gap-y-10 items-center justify-around xl:my-[54px]">
                {footerConfig.logos.map((logo) => (
                    <img
                        key={logo.id}
                        src={logo.src}
                        alt={logo.name}
                        style={{ width: logo.width, height: logo.height }}
                        className="object-contain"
                    />
                ))}
            </div>
            <p className="font-garet font-medium text-[19px]/[28px] text-[#C09ED5] text-center tracking-normal">
                {footerConfig.copyright}
            </p>
        </footer>
    );
};

export default Footer;