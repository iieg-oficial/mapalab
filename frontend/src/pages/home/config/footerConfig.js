import logoMapalabLargeDark from '@assets/logos/mapalab_large_dark.svg';
import logoIiegLargeDark from '@assets/logos/iieg_large_dark.svg';
import logoJaliscoLargeDark from '@assets/logos/jalisco_large_dark.svg';

const footerConfig = {
    logos: [
        {
            id: 1,
            name: 'MapaLab',
            src: logoMapalabLargeDark,
            width: '335px',
            height: '57px'
        }, {
            id: 2,
            name: 'IIEG',
            src: logoIiegLargeDark,
            width: '280px',
            height: '100px'
        }, {
            id: 3,
            name: 'Jalisco',
            src: logoJaliscoLargeDark,
            width: '280px',
            height: '100px'
        }
    ],
    copyright: 'TODOS LOS DERECHOS RESERVADOS'
};

export default footerConfig;
