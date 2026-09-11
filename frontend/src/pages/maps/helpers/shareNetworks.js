const ICONOS_REDES = '/acervo/iieg/iconos/redes%20sociales';

const svgProvisional = (glifo) => `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 51 51"><circle cx="25.5" cy="25.5" r="25.5" fill="#ff8300"/>${glifo}</svg>`,
)}`;

const GLIFO_WHATSAPP = '<path d="M25.5 13.5a12 12 0 0 0-10.4 18l-1.6 5.9 6.1-1.6a12 12 0 1 0 5.9-22.3z" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/>'
    + '<path d="M19.19 20.2c.4-.9 1-.9 1.4-.9h.9c.3 0 .6.1.8.6l1.1 2.6c.1.3.1.6-.1.9l-.7.9c-.2.2-.2.5 0 .8a8.6 8.6 0 0 0 3.9 3.4c.3.1.6.1.8-.1l.9-1.1c.2-.3.6-.3.9-.2l2.5 1.2c.4.2.5.4.5.7 0 .8-.4 1.9-1.7 2.4-1.3.6-3.1.3-5.6-1.1a15 15 0 0 1-4.9-4.9c-1.2-2.1-1.2-3.8-.5-5.2z" fill="#fff"/>';

const GLIFO_TELEGRAM = '<path d="M12.8 24.6l22.7-8.8c1.1-.4 2 .3 1.7 1.9l-3.9 18.2c-.3 1.3-1.1 1.6-2.1 1l-5.8-4.3-2.8 2.7c-.3.3-.6.6-1.2.6l.4-5.9 10.8-9.8c.5-.4-.1-.7-.7-.3l-13.4 8.4-5.7-1.8c-1.2-.4-1.3-1.3.3-1.9z" fill="#fff"/>';

export const TEXTO_COMPARTIR = 'Mapa personalizado de Jalisco en MapaLab, del IIEG';

export const REDES_COMPARTIR = [
    {
        id: 'whatsapp',
        etiqueta: 'WhatsApp',
        icono: `${ICONOS_REDES}/ico_wa.svg`,
        respaldo: svgProvisional(GLIFO_WHATSAPP),
        construir: (url, texto) => `https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`,
    },
    {
        id: 'facebook',
        etiqueta: 'Facebook',
        icono: `${ICONOS_REDES}/ico_fb.svg`,
        construir: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
        id: 'x',
        etiqueta: 'X',
        icono: `${ICONOS_REDES}/ico_x.svg`,
        construir: (url, texto) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(texto)}`,
    },
    {
        id: 'linkedin',
        etiqueta: 'LinkedIn',
        icono: `${ICONOS_REDES}/ico_in.svg`,
        construir: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
        id: 'telegram',
        etiqueta: 'Telegram',
        icono: `${ICONOS_REDES}/ico_tg.svg`,
        respaldo: svgProvisional(GLIFO_TELEGRAM),
        construir: (url, texto) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(texto)}`,
    },
];
