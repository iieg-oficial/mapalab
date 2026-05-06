import { useEffect } from 'react';
import { useLocation } from 'react-router';

const SITE_URL_RAW = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');
const BASE_PATH = (import.meta.env.VITE_BASE_PATH || '/').replace(/\/$/, '');
const SITE_URL = BASE_PATH ? `${SITE_URL_RAW}${BASE_PATH}` : SITE_URL_RAW;

const upsertMeta = (key, keyValue, content) => {
    let el = document.head.querySelector(`meta[${key}="${keyValue}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(key, keyValue);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
};

const removeMeta = (key, keyValue) => {
    const el = document.head.querySelector(`meta[${key}="${keyValue}"]`);
    if (el) el.remove();
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
    let el = document.head.querySelector('script[type="application/ld+json"][data-seo="page"]');
    if (!el) {
        el = document.createElement('script');
        el.setAttribute('type', 'application/ld+json');
        el.setAttribute('data-seo', 'page');
        document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
};

const buildPageUrl = (routePath) => {
    if (!routePath || routePath === '/') return `${SITE_URL}/`;
    const normalized = routePath.startsWith('/') ? routePath : `/${routePath}`;
    return `${SITE_URL}${normalized}`;
};

const SEO = ({ title, description, path, image, schemaType = 'WebSite', noindex = false, keywords }) => {
    const location = useLocation();

    useEffect(() => {
        const routePath = path !== undefined ? path : location.pathname;
        const pageUrl = buildPageUrl(routePath);
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

        if (noindex) {
            upsertMeta('name', 'robots', 'noindex,nofollow');
        } else {
            removeMeta('name', 'robots');
        }

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

        if (keywords) {
            jsonLd.keywords = keywords;
            upsertMeta('name', 'keywords', keywords);
        }

        upsertJsonLd(jsonLd);
    }, [title, description, path, image, schemaType, noindex, keywords, location.pathname]);

    return null;
};

export default SEO;
