import imgInfoBanner from '@assets/images/img_info_banner.png';
import imgDescargadaBanner from '@assets/images/img_descargada_banner.png';
import imgHerramientasBanner from '@assets/images/img_herramientas_banner.png';

const selectConfig = {
    title: 'No te pierdas estás funcionalidades del mapa',
    description: '* La visualización de las capas dependerá de tu navegador; te sugerimos eliminar las capas que no estés utilizando para un mejor rendimiento del mapa.',
    options: [
        {
            id: 1,
            image: imgInfoBanner,
            header: 'Tarjeta de información específica por capa',
            label: 'Al seleccionar una capa desde el menú, se mostrará en el panel de capas activas con sus acciones: ocultarla, cambiar el orden del listado, ver su tarjeta de información, así como eliminar la capa. \n \n Al activar la tarjeta informativa de la capa podrás descargar la capa, ajustar su opacidad, consultar su descripción, numeralia, filtrar información por periodo de tiempo, así como conocer la metodología, fuente y fecha de actualización.',
            color: '#FFB98E'
        }, {
            id: 2,
            image: imgDescargadaBanner,
            header: '¿Qué información puedo descargar?',
            label: 'En MapaLab puedes descargar la visualización completa del mapa o el contenido de las capas activas. Las capas pueden descargarse de forma personalizada desde su tarjeta informativa para trabajar posteriormente en software SIG.',
            color: '#CBC5F1'
        }, {
            id: 3,
            image: imgHerramientasBanner,
            header: '¿Qué herramientas tiene MapaLab?',
            label: 'MapaLab ofrece herramientas para analizar el mapa, como el trazado y medición de líneas y polígonos, consulta de información por punto, gestión de mediciones guardadas y la posibilidad de agregar marcadores personalizados con emojis. 😉',
            color: '#FFE09B'
        }
    ]
};

export default selectConfig;
