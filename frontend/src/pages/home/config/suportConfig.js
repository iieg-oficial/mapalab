const suportConfig = {
    sections: [
        {
            id: 1,
            label: 'Preguntas frecuentes',
            icon: '/src/assets/icons/ico_big_card_hover.svg',
            iconHover: '/src/assets/icons/ico_big_card_hover.svg',
            content: [
                { question: '¿Cómo puedo navegar en el mapa?', answer: 'Puedes usar el mouse para arrastrar y hacer zoom con la rueda del mouse.' },
                { question: '¿Cómo descargo una capa?', answer: 'Selecciona la capa y haz clic en el botón de descarga en la tarjeta de información.' },
                { question: '¿Puedo ver varias capas a la vez?', answer: 'Sí, puedes activar múltiples capas desde el menú lateral.' }
            ]
        },
        {
            id: 2,
            label: 'Documentación',
            icon: '/src/assets/icons/ico_question.svg',
            iconHover: '/src/assets/icons/ico_question.svg',
            content: [
                { title: 'Guía de inicio', description: 'Aprende los conceptos básicos para usar MapaLab.' },
                { title: 'Manual de usuario', description: 'Documentación completa de todas las funcionalidades.' },
                { title: 'API Reference', description: 'Documentación técnica para desarrolladores.' }
            ]
        }
    ]
};

export default suportConfig;
