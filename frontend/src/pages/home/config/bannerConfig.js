const bannerConfig = {
    banners: [
        {
            id: 'banner-home-1',
            active: true,
            gradient: {
                angle: '359deg',
                from: '#5C2472',
                to: '#963CBA'
            },
            logo: {
                src: 'src/assets/logos/mapalab_short.svg',
                alt: 'MapaLab Logo'
            },
            content: {
                titleHighlight: 'Explora',
                titleRest: 'Jalisco en capas',
                description: 'MapaLab es una herramienta interactiva que pone a tu alcance información geoespacial confiable y actualizada.',
                button: {
                    label: 'Quiero explorar el mapa',
                    link: '/mapa'
                }
            },
            image: {
                src: 'src/assets/png/bannerHeader.png',
                alt: 'Vista previa del mapa interactivo'
            }
        }
    ]
};

export default bannerConfig;
