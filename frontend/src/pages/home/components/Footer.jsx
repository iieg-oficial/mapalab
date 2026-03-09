import footerConfig from '../config/footerConfig';

const LogoWrapper = ({ logo, children }) => {
    if (logo.link) return <a href={logo.link} target="_blank" rel="noopener noreferrer">{children}</a>;
    if (logo.link === '') return <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="cursor-pointer">{children}</button>;
    return children;
};

const Footer = () => {
    return (
        <footer className="bg-purple p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-10 mb-10 lg:gap-x-10 xl:my-[54px]">
                {footerConfig.logos.map((logo) => (
                    <div key={logo.id} className="flex items-center justify-center">
                        <LogoWrapper logo={logo}>
                            <img
                                src={logo.src}
                                alt={logo.name}
                                style={{ width: logo.width, height: logo.height }}
                                className="object-contain"
                                loading="lazy"
                            />
                        </LogoWrapper>
                    </div>
                ))}
            </div>
            <p className="font-garet font-medium text-[19px]/[28px] text-[#C09ED5] text-center tracking-normal">
                {footerConfig.copyright}
            </p>
            {footerConfig.linkPrivacyPolicy && (
                <a href={footerConfig.linkPrivacyPolicy} target="_blank" rel="noopener noreferrer"
                    className="block font-garet font-medium text-[14px]/[18px] text-[#C09ED5] text-center tracking-normal underline mt-2 hover:text-white transition-colors">
                    {footerConfig.privacyPolicy}
                </a>
            )}
        </footer>
    );
};

export default Footer;