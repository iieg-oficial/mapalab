import footerConfig from '../config/footerConfig';
import { useHomeContent } from '@hooks/useHomeContent';
import ReportButton from '@components/ReportButton';

const LogoWrapper = ({ logo, children }) => {
    if (logo.link) return <a href={logo.link} target="_blank" rel="noopener noreferrer">{children}</a>;
    if (logo.link === '') return <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="cursor-pointer">{children}</button>;
    return children;
};

const Footer = () => {
    const { home } = useHomeContent();
    const apiFooter = home?.footer;
    const copyright = (apiFooter?.copyright?.trim()
        ? `${apiFooter.copyright} ${new Date().getFullYear()}`.replace(/\s+/g, ' ').trim()
        : footerConfig.copyright);
    const privacyLabel = apiFooter?.privacyPolicyLabel || footerConfig.privacyPolicy;
    const privacyHref = apiFooter?.privacyPolicyHref || footerConfig.linkPrivacyPolicy;

    const apiLogos = apiFooter?.logos?.length
        ? apiFooter.logos.map((l) => ({
            id: l.id,
            name: l.name,
            src: l.imagenUrl,
            link: l.href,
            width: l.width,
            height: l.height,
        }))
        : footerConfig.logos;

    return (
        <footer className="bg-purple p-10 relative">
            <div className="absolute bottom-4 right-4">
                <ReportButton variant="floating" label="Reportar un problema o sugerencia" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-10 mb-10 lg:gap-x-10 xl:my-[54px]">
                {apiLogos.map((logo) => (
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
                {copyright}
            </p>
            {privacyHref && (
                <a href={privacyHref} target="_blank" rel="noopener noreferrer"
                    className="block font-garet font-medium text-[14px]/[18px] text-[#C09ED5] text-center tracking-normal underline mt-2 hover:text-white transition-colors">
                    {privacyLabel}
                </a>
            )}
        </footer>
    );
};

export default Footer;