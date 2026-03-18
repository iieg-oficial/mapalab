import icoQuestion from '@assets/icons/ico_preguntas.png';
import icoAvisoPrivacidad from '@assets/icons/ico_aviso_privacidad.svg';

<<<<<<< HEAD
const suportConfig = {
    sections: [
        {
            id: 1,
            label: 'Preguntas frecuentes',
            icon: icoQuestion,
            iconHover: icoQuestion,
            content: [
                { question: '¿Qué es MapaLab y para qué sirve?', answer: 'MapaLab es un geoportal que concentra información geoespacial y estadística de distintos temas para el estado de Jalisco.' },
                { question: '¿Qué tipo de información puedo consultar?', answer: 'Puedes consultar información demográfica, económica, de educación, salud, seguridad, desarrollo social, recursos naturales y calidad de vida, gobierno y ciudadanía.' },
                { question: '¿Puedo visualizar diferentes capas temáticas?', answer: 'Sí, en Mapalab puedes visualizar diferentes capas temáticas y combinarlas según la información que necesites analizar.' },
                { question: '¿Puedo descargar los datos que estoy consultando?', answer: '¡Claro! Puedes descargar la base de datos y además elegir únicamente la información de la capa que te interese. La descarga incluye metadatos para facilitar la compresión del contenido.' },
                { question: '¿Los datos están actualizados?', answer: 'Cada capa tiene actualizaciones en fechas distintas, indicadas en su tarjeta de información específica. La información de las capas se actualiza conforme las fuentes generan nueva información, en algunos capas aunque la actualización no sea reciente, la información que se presenta es la vigente.' },
                { question: '¿Se pueden hacer comparaciones entre municipios o regiones de Jalisco?', answer: 'Actualmente no es posible comparar municipios o regiones de Jalisco en MapaLab. Sin embargo, está funcionalidad ya está contemplada para las siguientes versiones.' },
                { question: '¿Puedo consultar tendencias o cambios a lo largo del tiempo?', answer: '¡Por supuesto! En la tarjeta de información específica de cada capa se indican los distintos periodos disponibles para la selección de tu visualización.' },
                { question: '¿Mapalab está optimizado para tabletas o dispositivos móviles?', answer: 'MapaLab es compatible con cualquier dispositivo, pero recomendamos usar una computadora para disfrutar de la mejor experiencia visual y funcional.' },
                { question: '¿Cómo puedo contactar al IIEG si tengo dudas sobre el uso o los datos de MapaLab?', answer: 'Para dudas y preguntas sobre MapaLab puedes contactarnos a través del correo contacto@iieg.gob.mx.' },
                { question: '¿Quién produce la información disponible en MapaLab?', answer: 'En la tarjeta de información específica de cada capa se indica la fuente original, así como las capas que tienen algún tipo de transformación o procesamiento interno.' },
            ]
        }
=======
const suportConfig = [{
    id: 1,
    label: 'Preguntas frecuentes',
    icon: icoQuestion,
    iconHover: icoQuestion,
    content: [
        { question: '¿Qué es MapaLab y para qué sirve?', answer: 'MapaLab es un geoportal que concentra información geoespacial de distintos temas para el estado de Jalisco.' },
        { question: '¿Qué tipo de información puedo consultar?', answer: 'Puedes consultar información de las temáticas: Economía, Recursos y calidad de vida, Seguridad, Salud, Educación, Desarrollo Social, Gobierno y ciudadanía, Demografía ¡y más!' },
        { question: '¿Puedo visualizar diferentes capas temáticas?', answer: 'Sí, en Mapalab puedes visualizar diferentes capas temáticas y combinarlas según la información que necesites analizar.' },
        { question: '¿Puedo descargar los datos que estoy consultando?', answer: '¡Claro! Puedes descargar la base de datos y además elegir únicamente la información de la capa que te interese. La descarga incluye metadatos para facilitar la compresión del contenido.' },
        { question: '¿Los datos están actualizados?', answer: 'Cada capa tiene actualizaciones en fechas distintas, que se muestran en su tarjeta informativa correspondiente. La información de cada capa se actualiza a medida que las fuentes emiten nuevos datos. La información vigente de cada capa en Mapalab es la que corresponde a su última actualización disponible de la fuente original.' },
        { question: '¿Se pueden hacer comparaciones entre municipios o regiones de Jalisco?', answer: 'Actualmente no es posible comparar municipios o regiones de Jalisco en MapaLab. Sin embargo, está funcionalidad ya está contemplada para las siguientes versiones.' },
        { question: '¿Puedo consultar tendencias o cambios a lo largo del tiempo?', answer: '¡Por supuesto! En la tarjeta de información específica de cada capa se indican los distintos periodos disponibles para la selección de tu visualización.' },
        { question: '¿Mapalab está optimizado para tabletas o dispositivos móviles?', answer: 'MapaLab es compatible con cualquier dispositivo, pero recomendamos usar una computadora para disfrutar de la mejor experiencia visual y funcional.' },
        { question: '¿Cómo puedo contactar al IIEG si tengo dudas sobre el uso o los datos de MapaLab?', answer: 'Somos un equipo con mucha ansiedad social, pero si es absolutamente necesario, puedes escribirnos a contacto@iieg.gob.mx (cheems)' },
        { question: '¿Quién produce la información disponible en MapaLab?', answer: 'En la tarjeta de información específica de cada capa se indica la fuente original, así como las capas que tienen algún tipo de transformación o procesamiento interno.' },
>>>>>>> develop
    ]
}, {
    id: 2,
    label: 'Aviso de privacidad',
    icon: icoAvisoPrivacidad,
    iconHover: icoAvisoPrivacidad,
    link: 'https://iieg.gob.mx/ns/wp-content/uploads/2025/06/Aviso_de_Privacidad_Integral_IIEG_06_2025.pdf',
    content: [],
}
];

export default suportConfig;
