const API_HOST = (import.meta.env.VITE_BACKEND_API_HOST || '/api/').replace(/\/+$/, '');

let pendiente = null;

export const fetchEdificioInstituto = () => {
    if (!pendiente) {
        pendiente = fetch(`${API_HOST}/instituto/edificio`).then((res) => {
            if (!res.ok) throw new Error(`Backend responde ${res.status} al pedir el edificio del instituto`);
            return res.json();
        }).catch((error) => {
            pendiente = null;
            throw error;
        });
    }
    return pendiente;
};
