import logoMapalabLargeDark from '@assets/logos/mapalab_large_dark.svg';
import logoIiegLargeDark from '@assets/logos/iieg_large_dark.svg';
import logoJaliscoLargeDark from '@assets/logos/jalisco_large_dark.svg';

const footerConfig = {
    logos: [
        {
            id: 1,
            name: 'MapaLab',
            src: logoMapalabLargeDark,
            link: '',
            width: '335px',
            height: '57px'
        }, {
            id: 2,
            name: 'IIEG',
            src: logoIiegLargeDark,
            link: 'https://iieg.jalisco.gob.mx/',
            width: '230px',
            height: '80px'
        }, {
            id: 3,
            name: 'Jalisco',
            src: logoJaliscoLargeDark,
            link: 'https://www.jalisco.gob.mx/inicio',
            width: '230px',
            height: '80px'
        }
    ],
    copyright: `Instituto de Información Estadística y Geográfica de Jalisco © ${new Date().getFullYear()}`,
    privacyPolicy: 'Aviso de Privacidad',
    linkPrivacyPolicy: 'https://iieg.jalisco.gob.mx/aviso-de-privacidad'
};

export default footerConfig;
