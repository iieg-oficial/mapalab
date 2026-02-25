import imgBuscador from '@assets/images/img_buscador.svg';
import imgNavegacionTematica from '@assets/images/img_navegacion_tematica.svg';
import imgActivarCapa from '@assets/images/img_activar_capa.svg';
import imgInformacion from '@assets/images/img_Informacion.svg';
import imgHerramientas from '@assets/images/img_herramientas.svg';
import imgDescargarCapaNormal from '@assets/images/img_descargar_capa_normal.svg';

const guideConfig = {
    title: '¿Cómo navegar en MapaLab?',
    note: '*Para un mejor funcionamiento, te sugerimos acceder desde una computadora.',
    steps: [
        {
            id: 1,
            image: imgBuscador,
            header: 'Búsqueda por palabra clave',
            label: 'Utiliza el buscador para encontrar capas relacionadas y activar las que desees visualizar en el mapa.'
        },
        {
            id: 2,
            image: imgNavegacionTematica,
            header: 'Navegación por temáticas',
            label: 'Explora las distintas temáticas del menú para ver y seleccionar las capas disponibles.'
        },
        {
            id: 3,
            image: imgActivarCapa,
            header: 'Activación de capas',
            label: 'Activa o desactiva capas según tus necesidades; cada una cuenta con una tarjeta con información y acciones específicas.'
        },
        {
            id: 4,
            image: imgInformacion,
            header: 'Consulta de información puntual',
            label: 'Al seleccionar un punto en el mapa, se muestra una tarjeta con los datos más relevantes.'
        },
        {
            id: 5,
            image: imgHerramientas,
            header: 'Uso de distintas herramientas',
            label: 'Utiliza herramientas de medición y agrega marcadores personalizados con emojis.'
        },
        {
            id: 6,
            image: imgDescargarCapaNormal,
            header: 'Descarga de capas',
            label: 'Descarga la visualización del mapa o la información específica de cada capa, puedes descargar la capa para trabajarla en plataformas SIG.'
        }
    ]
};

export default guideConfig;
