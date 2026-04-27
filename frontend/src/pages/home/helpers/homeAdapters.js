import topicsConfig from '../config/topicsConfig';
import guideConfig from '../config/guideConfig';
import selectConfig from '../config/selectConfig';

export const DEFAULT_VIDEO_ID = 'MzuImZuDM3E';
export const DEFAULT_SELECT_COLOR = '#FFE09B';


export const buildTopics = (apiTopics) => {
    if (!apiTopics?.length) return topicsConfig.topics;
    return apiTopics
        .filter((t) => t.activo !== false)
        .map((t) => ({
            id: t.id,
            label: t.titulo,
            description: t.descripcion,
            icon: t.icon || t.id,
            imageUrl: t.imagenUrl,
            subtopics: (t.subtopics || []).map((s) => ({
                label: s.label,
                layerIds: s.layerIds || s.layer_ids || [],
                link: s.link || '',
            })),
        }));
};

export const buildGuide = (apiGuide) => {
    if (!apiGuide?.length) return guideConfig.steps;
    return apiGuide.map((s) => ({
        id: s.id,
        image: s.imagenUrl,
        header: s.titulo,
        label: s.descripcion,
    }));
};

export const buildSelect = (apiSelect) => {
    if (!apiSelect?.length) return selectConfig.options;
    return apiSelect.map((o) => ({
        id: o.id,
        image: o.imagenUrl,
        header: o.titulo,
        label: o.descripcion,
        color: o.color || DEFAULT_SELECT_COLOR,
    }));
};

export const buildFaqContent = (apiFaq) => {
    if (!apiFaq?.length) return null;
    return apiFaq.map((q, idx) => ({
        question: q.pregunta,
        answer: q.respuesta,
        _key: q.id || `faq-${idx}`,
    }));
};
