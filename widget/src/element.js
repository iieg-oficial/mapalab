import { LitElement, html } from 'lit';
import { widgetStyles } from './styles.js';


const DEFAULT_BASE_URL = 'https://iieg.jalisco.gob.mx/mapalab';
const DEFAULT_READY_TIMEOUT_MS = 8000;


const enviarBeacon = (url, body) => {
    try {
        return Boolean(navigator.sendBeacon?.(url, new Blob([body], { type: 'text/plain' })));
    } catch {
        return false;
    }
};


const enviarFetch = (url, body) => {
    try {
        fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            credentials: 'omit',
            keepalive: true,
            headers: { 'Content-Type': 'text/plain' },
            body,
        }).catch(() => null);
    } catch {
        return;
    }
};


export class IiegMapalab extends LitElement {
    static properties = {
        apiKey: { type: String, attribute: 'api-key' },
        share: { type: String },
        layers: { type: String },
        center: { type: String },
        zoom: { type: String },
        basemap: { type: String },
        controls: { type: String },
        notices: { type: String },
        marker: { type: String },
        markerIcon: { type: String, attribute: 'marker-icon' },
        markerColor: { type: String, attribute: 'marker-color' },
        markerTitle: { type: String, attribute: 'marker-title' },
        markerDescription: { type: String, attribute: 'marker-description' },
        markerCard: { type: String, attribute: 'marker-card' },
        height: { type: String, reflect: true },
        width: { type: String, reflect: true },
        baseUrl: { type: String, attribute: 'base-url' },
        title: { type: String },
        readyTimeoutMs: { type: Number, attribute: 'ready-timeout-ms' },
        _ready: { type: Boolean, attribute: false },
        _timedOut: { type: Boolean, attribute: false },
        _error: { type: Object, attribute: false },
    };

    static styles = widgetStyles;

    constructor() {
        super();
        this.apiKey = '';
        this.share = '';
        this.layers = '';
        this.center = '';
        this.zoom = '';
        this.basemap = '';
        this.controls = '';
        this.notices = '';
        this.marker = '';
        this.markerIcon = '';
        this.markerColor = '';
        this.markerTitle = '';
        this.markerDescription = '';
        this.markerCard = '';
        this.height = '';
        this.width = '';
        this.baseUrl = '';
        this.title = 'Mapa MapaLab';
        this.readyTimeoutMs = DEFAULT_READY_TIMEOUT_MS;
        this._ready = false;
        this._timedOut = false;
        this._error = null;
        this._reloadKey = 0;
        this._timeoutId = null;
        this._reportados = new Set();
        this._messageHandler = this._onMessage.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('message', this._messageHandler);
        this._applyDimensions();
        this._scheduleTimeout();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('message', this._messageHandler);
        this._clearTimeout();
    }

    updated(changed) {
        if (changed.has('height') || changed.has('width')) {
            this._applyDimensions();
        }
    }

    _applyDimensions() {
        if (this.height) {
            this.style.height = /^\d+$/.test(this.height) ? `${this.height}px` : this.height;
        }
        if (this.width) {
            this.style.width = /^\d+$/.test(this.width) ? `${this.width}px` : this.width;
        }
    }

    _scheduleTimeout() {
        this._clearTimeout();
        if (!this.apiKey) return;
        const ms = Number(this.readyTimeoutMs) > 0 ? Number(this.readyTimeoutMs) : DEFAULT_READY_TIMEOUT_MS;
        this._timeoutId = setTimeout(() => {
            if (!this._ready) {
                this._timedOut = true;
                this.dispatchEvent(new CustomEvent('mapalab:timeout', {
                    detail: { ms, reason: 'no_ready_received' },
                }));
                this._reportar('timeout');
            }
        }, ms);
    }

    _clearTimeout() {
        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }
    }

    _retry() {
        this._error = null;
        this._timedOut = false;
        this._ready = false;
        this._reportados = new Set();
        this._reloadKey += 1;
        this.requestUpdate();
        this._scheduleTimeout();
    }

    _buildFallbackUrl() {
        const base = (this.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
        const params = new URLSearchParams();
        if (this.share) {
            params.set('s', this.share);
        } else {
            if (this.layers) params.set('layers', this.layers);
            if (this.center) params.set('center', this.center);
            if (this.marker) params.set('marker', this.marker);
            if (this.zoom) params.set('zoom', this.zoom);
        }
        const qs = params.toString();
        return qs ? `${base}/mapa?${qs}` : `${base}/mapa`;
    }

    _buildSrc() {
        const base = (this.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
        const params = new URLSearchParams();
        if (this.apiKey) params.set('key', this.apiKey);
        if (this.share) {
            params.set('s', this.share);
        } else {
            if (this.layers) params.set('layers', this.layers);
            if (this.center) params.set('center', this.center);
            if (this.zoom) params.set('zoom', this.zoom);
        }
        if (this.marker) params.set('marker', this.marker);
        if (this.markerIcon) params.set('markerIcon', this.markerIcon);
        if (this.markerColor) params.set('markerColor', this.markerColor);
        if (this.markerTitle) params.set('markerTitle', this.markerTitle);
        if (this.markerDescription) params.set('markerDescription', this.markerDescription);
        if (this.markerCard) params.set('markerCard', this.markerCard);
        if (this.basemap) params.set('basemap', this.basemap);
        if (this.controls) params.set('controls', this.controls);
        if (this.notices === 'false' || this.notices === false) params.set('notices', 'false');
        if (this._reloadKey) params.set('_r', String(this._reloadKey));
        return `${base}/embed?${params.toString()}`;
    }

    _telemetryUrl() {
        const base = (this.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
        return `${base}/api/embed/telemetry?key=${encodeURIComponent(this.apiKey)}`;
    }

    _reportar(tipo) {
        if (!this.apiKey || this._reportados.has(tipo)) return;
        this._reportados.add(tipo);
        const url = this._telemetryUrl();
        const body = JSON.stringify({ eventos: [{ tipo }] });
        if (!enviarBeacon(url, body)) enviarFetch(url, body);
    }

    _embedOrigin() {
        try {
            return new URL(this.baseUrl || DEFAULT_BASE_URL, window.location.href).origin;
        } catch {
            return null;
        }
    }

    _isFromIframe(event) {
        const iframe = this.renderRoot?.querySelector('iframe');
        if (!iframe || event.source !== iframe.contentWindow) return false;
        return event.origin === this._embedOrigin();
    }

    _onMessage(event) {
        if (!this._isFromIframe(event)) return;
        const data = event.data;
        if (!data || typeof data !== 'object') return;
        if (data.type === 'mapalab:ready') {
            this._ready = true;
            this._timedOut = false;
            this._error = null;
            this._clearTimeout();
            this.dispatchEvent(new CustomEvent('mapalab:ready', { detail: data.payload || {} }));
        } else if (data.type === 'mapalab:error') {
            this._error = data.payload || { message: 'Error desconocido' };
            this._clearTimeout();
            this.dispatchEvent(new CustomEvent('mapalab:error', { detail: data.payload || {} }));
            this._reportar('error');
        } else if (data.type === 'mapalab:feature-click') {
            this.dispatchEvent(new CustomEvent('mapalab:feature-click', { detail: data.payload || {} }));
        }
    }

    _renderOverlay(title, message) {
        const fullUrl = this._buildFallbackUrl();
        return html`
            <div class="mapalab-overlay" role="status" aria-live="polite">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="mapalab-actions">
                    <button class="primary" @click=${() => this._retry()} type="button">Reintentar</button>
                    <a href=${fullUrl} target="_blank" rel="noopener">Abrir el mapa en MapaLab</a>
                </div>
            </div>
        `;
    }

    render() {
        if (!this.apiKey) {
            return this._renderOverlay(
                'Mapa no disponible',
                'El widget no recibió la contraseña de la llave necesaria para mostrar el mapa. Si eres administrador del sitio, revisa que el atributo api-key esté correctamente configurado.',
            );
        }
        if (this._error) {
            const msg = this._error.message || 'El visor reportó un problema.';
            return this._renderOverlay('No se pudo cargar el mapa', `${msg} Puedes reintentar o abrir el visor completo del IIEG.`);
        }
        if (this._timedOut && !this._ready) {
            return this._renderOverlay(
                'El mapa está tardando más de lo normal',
                'Tu conexión o nuestro servicio podrían estar lentos. Puedes reintentar o ver el mapa completo en MapaLab.',
            );
        }
        const src = this._buildSrc();
        return html`
            <iframe
                src=${src}
                title=${this.title}
                allow="fullscreen"
                referrerpolicy="strict-origin-when-cross-origin"
                loading="lazy"
            ></iframe>
        `;
    }
}
