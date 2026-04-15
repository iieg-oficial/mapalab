import { useEffect } from 'react';

const SITE_URL = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');

const upsertMeta = (key, keyValue, content) => {
    let el = document.head.querySelector(`meta[${key}="${keyValue}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(key, keyValue);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
};

const upsertCanonical = (href) => {
    let el = document.head.querySelector('link[rel="canonical"]');
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        document.head.appendChild(el);
    }
    el.setAttribute('href', href);
};

const upsertJsonLd = (data) => {
    let el = document.head.querySelector('script[type="application/ld+json"]');
    if (!el) {
        el = document.createElement('script');
        el.setAttribute('type', 'application/ld+json');
        document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
};

const SEO = ({ title, description, path = '', image, schemaType = 'WebSite' }) => {
    useEffect(() => {
        const pageUrl = path ? `${SITE_URL}/${path}` : SITE_URL;
        const ogImage = image || `${SITE_URL}/img_link_share.png`;

        document.title = title;

        upsertMeta('name', 'description', description);
        upsertMeta('property', 'og:title', title);
        upsertMeta('property', 'og:description', description);
        upsertMeta('property', 'og:image', ogImage);
        upsertMeta('property', 'og:url', pageUrl);
        upsertMeta('property', 'og:type', 'website');
        upsertMeta('property', 'og:locale', 'es_MX');
        upsertMeta('name', 'twitter:card', 'summary_large_image');
        upsertMeta('name', 'twitter:title', title);
        upsertMeta('name', 'twitter:description', description);
        upsertMeta('name', 'twitter:image', ogImage);

        upsertCanonical(pageUrl);

        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': schemaType,
            name: title,
            url: pageUrl,
            description,
            image: ogImage,
            publisher: {
                '@type': 'GovernmentOrganization',
                name: 'Instituto de Información Estadística y Geográfica de Jalisco (IIEG)',
                url: 'https://iieg.jalisco.gob.mx',
            },
        };

        if (schemaType === 'WebApplication') {
            jsonLd.applicationCategory = 'GeographicApplication';
            jsonLd.operatingSystem = 'Web';
        }

        upsertJsonLd(jsonLd);
    }, [title, description, path, image, schemaType]);

    return null;
};

export default SEO;
