import { layers } from '../pages/maps/helpers/layers/index';

const processLayerTree = (layer, tema, temaLabel, subtema, subtemaLabel) => {
    const result = {};

    if (!layer || !layer.id) return result;

    if (layer.children) {
        layer.children.forEach(child => {
            if (!child || !child.id) return;

            if (child.children) {
                Object.assign(
                    result,
                    processLayerTree(child, tema, temaLabel, child.id, child.label)
                );
            } else if (child.wmsConfig) {
                const searchMeta = child.searchMeta || {};
                const label = child.label || child.id || '';
                if (!label) return;

                const labelWords = label.toLowerCase().split(/\s+/);

                result[child.id] = {
                    tema: tema || '',
                    temaLabel: temaLabel || '',
                    subtema: subtema || '',
                    subtemaLabel: subtemaLabel || '',
                    label,
                    searchableFields: searchMeta.searchableFields || [],
                    hasMunicipio: searchMeta.hasMunicipio || false,
                    hasDireccion: searchMeta.hasDireccion || false,
                    municipioField: searchMeta.municipioField || 'municipio',
                    direccionField: searchMeta.direccionField || 'direccion',
                    tags: [...(searchMeta.tags || []), ...labelWords]
                };
            }
        });
    } else if (layer.wmsConfig) {
        const searchMeta = layer.searchMeta || {};
        const label = layer.label || layer.id || '';
        if (!label) return result;

        const labelWords = label.toLowerCase().split(/\s+/);

        result[layer.id] = {
            tema: tema || '',
            temaLabel: temaLabel || '',
            subtema: subtema || tema || '',
            subtemaLabel: subtemaLabel || temaLabel || '',
            label,
            searchableFields: searchMeta.searchableFields || [],
            hasMunicipio: searchMeta.hasMunicipio || false,
            hasDireccion: searchMeta.hasDireccion || false,
            municipioField: searchMeta.municipioField || 'municipio',
            direccionField: searchMeta.direccionField || 'direccion',
            tags: [...(searchMeta.tags || []), ...labelWords]
        };
    }

    return result;
};

const buildSearchConfig = () => {
    const config = {};

    layers.forEach(temaLayer => {
        Object.assign(config, processLayerTree(temaLayer, temaLayer.id, temaLayer.label));
    });

    return config;
};

const SEARCH_CONFIG = buildSearchConfig();

export const getSearchConfig = (layerId) => {
    return SEARCH_CONFIG[layerId] || null;
};

export const getAllLayerIds = () => {
    return Object.keys(SEARCH_CONFIG);
};

export const getLayersWithMunicipioSearch = () => {
    return Object.entries(SEARCH_CONFIG)
        .filter(([, config]) => config.hasMunicipio)
        .map(([id, config]) => ({ id, ...config }));
};

export const getLayersWithDireccionSearch = () => {
    return Object.entries(SEARCH_CONFIG)
        .filter(([, config]) => config.hasDireccion)
        .map(([id, config]) => ({ id, ...config }));
};

export const getThemes = () => {
    const themes = new Set();
    Object.values(SEARCH_CONFIG).forEach(config => {
        themes.add(JSON.stringify({ id: config.tema, label: config.temaLabel }));
    });
    return Array.from(themes).map(t => JSON.parse(t));
};

export const getSubthemesByTheme = (temaId) => {
    const subtemas = {};
    Object.entries(SEARCH_CONFIG).forEach(([layerId, config]) => {
        if (config.tema === temaId) {
            if (!subtemas[config.subtema]) {
                subtemas[config.subtema] = {
                    label: config.subtemaLabel,
                    layers: []
                };
            }
            subtemas[config.subtema].layers.push({
                id: layerId,
                label: config.label
            });
        }
    });
    return subtemas;
};

export const isLayerSearchable = (layerId) => {
    return layerId in SEARCH_CONFIG;
};

const normalizePlurals = (text) => {
    const pluralRules = {
        'hospitales': 'hospital',
        'escuelas': 'escuela',
        'clinicas': 'clinica',
        'centros': 'centro',
        'institutos': 'instituto',
        'universidades': 'universidad',
        'preparatorias': 'preparatoria',
        'prepas': 'preparatoria',
        'primarias': 'primaria',
        'secundarias': 'secundaria',
        'kinders': 'kinder',
        'delitos': 'delito',
        'robos': 'robo',
        'bancos': 'banco',
        'negocios': 'negocio',
        'vehiculos': 'vehiculo',
        'casas': 'casa',
        'comercios': 'comercio',
        'mercados': 'mercado',
        'plazas': 'plaza',
        'parques': 'parque',
        'instalaciones': 'instalacion',
        'espacios': 'espacio',
        'municipios': 'municipio',
        'cultivos': 'cultivo',
        'presas': 'presa',
        'acuiferos': 'acuifero',
        'cuerpos': 'cuerpo',
        'publicos': 'publico',
        'privados': 'privado',
        'comunitarios': 'comunitario',
        'colectivos': 'colectivo',
    };

    return pluralRules[text] || text;
};

const normalizeText = (text) => {
    if (!text) return '';

    let normalized = text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const words = normalized.split(/\s+/);
    const normalizedWords = words.map(word => normalizePlurals(word));

    return normalizedWords.join(' ');
};

const similarity = (a, b) => {
    if (a.length === 0) return b.length === 0 ? 1 : 0;
    if (b.length === 0) return 0;

    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + cost
            );
        }
    }

    const distance = matrix[b.length][a.length];
    const maxLen = Math.max(a.length, b.length);
    return 1 - distance / maxLen;
};

const calculateWordScore = (word, keyword, minLength = 2) => {
    let score = 0;
    if (word === keyword) score += 20;
    else if (word.startsWith(keyword) && keyword.length > minLength) score += 10;
    else if (word.includes(keyword) && keyword.length > minLength) score += 5;
    else if (keyword.length > 3 && similarity(word, keyword) > 0.75) score += 8;
    return score;
};

const calculateLabelScore = (label, keyword) => {
    let score = 0;
    if (label === keyword) score += 30;
    else if (label.startsWith(keyword)) score += 15;
    else if (label.includes(keyword)) score += 10;

    const words = label.split(/\s+/);
    words.forEach(word => score += calculateWordScore(word, keyword));

    return score;
};

const calculateTagScore = (tags, keyword) => {
    let score = 0;
    tags.forEach(tag => {
        if (tag === keyword) score += 25;
        else if (tag.startsWith(keyword) && keyword.length > 2) score += 15;
        else if (tag.includes(keyword) && keyword.length > 2) score += 10;
        else if (keyword.includes(tag) && tag.length > 2) score += 8;
        else if (keyword.length > 3 && similarity(tag, keyword) > 0.8) score += 12;
    });
    return score;
};

const scoreLayerMatch = (config, keyword) => {
    const label = normalizeText(config.label);
    const tags = (config.tags || []).map(t => normalizeText(t)).filter(t => t.length > 0);

    return calculateLabelScore(label, keyword) + calculateTagScore(tags, keyword);
};

export const findBestMatch = (keyword) => {
    if (!keyword || keyword.trim() === '') return null;

    const normalized = normalizeText(keyword);
    const matches = [];

    Object.entries(SEARCH_CONFIG).forEach(([layerId, config]) => {
        if (!config || !config.label) return;

        const score = scoreLayerMatch(config, normalized);

        if (score > 0) {
            matches.push({
                layerId,
                tema: config.tema,
                subtema: config.subtema,
                score
            });
        }
    });

    matches.sort((a, b) => b.score - a.score);
    return matches.length > 0 ? matches[0] : null;
};

export const findAllMatches = (keyword, minScore = 10) => {
    if (!keyword || keyword.trim() === '') return [];

    const normalized = normalizeText(keyword);
    const keywordWords = normalized.split(/\s+/).filter(w => w.length > 0);
    const matchMap = new Map();

    keywordWords.forEach(word => {
        Object.entries(SEARCH_CONFIG).forEach(([layerId, config]) => {
            if (!config || !config.label) return;

            const score = scoreLayerMatch(config, word);

            if (score >= minScore) {
                const existing = matchMap.get(layerId);
                if (!existing || existing.score < score) {
                    matchMap.set(layerId, {
                        layerId,
                        tema: config.tema,
                        subtema: config.subtema,
                        label: config.label,
                        score,
                        matchedWord: word
                    });
                }
            }
        });
    });

    const matches = Array.from(matchMap.values());
    matches.sort((a, b) => b.score - a.score);

    return matches;
};
