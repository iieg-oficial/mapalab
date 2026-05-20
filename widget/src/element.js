import { LitElement, html, css } from 'lit';


const DEFAULT_BASE_URL = 'https://mapalab.iieg.gob.mx';
const DEFAULT_READY_TIMEOUT_MS = 8000;


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
        height: { type: String, reflect: true },
        width: { type: String, reflect: true },
        baseUrl: { type: String, attribute: 'base-url' },
        title: { type: String },
        readyTimeoutMs: { type: Number, attribute: 'ready-timeout-ms' },
        _ready: { type: Boolean, attribute: false },
        _timedOut: { type: Boolean, attribute: false },
        _error: { type: Object, attribute: false },
    };

    static styles = css`
        :host {
            display: block;
            width: 100%;
            min-height: 320px;
            position: relative;
            overflow: hidden;
            border-radius: var(--mapalab-radius, 8px);
            box-shadow: var(--mapalab-shadow, 0 1px 3px rgba(0,0,0,0.08));
            font-family: var(--mapalab-font, system-ui, -apple-system, sans-serif);
        }
        iframe {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            border: 0;
            display: block;
        }
        .mapalab-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            text-align: center;
            background: #fafafa;
            color: #374151;
        }
        .mapalab-overlay h3 {
            margin: 0 0 8px;
            font-size: 15px;
            font-weight: 600;
            color: #111827;
        }
        .mapalab-overlay p {
            margin: 0 0 16px;
            font-size: 13px;
            color: #6b7280;
            max-width: 480px;
        }
        .mapalab-overlay .mapalab-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: center;
        }
        .mapalab-overlay a, .mapalab-overlay button {
            display: inline-block;
            font: inherit;
            font-size: 13px;
            padding: 8px 14px;
            border-radius: 6px;
            border: 1px solid #703088;
            background: white;
            color: #703088;
            cursor: pointer;
            text-decoration: none;
        }
        .mapalab-overlay a.primary, .mapalab-overlay button.primary {
            background: #703088;
            color: white;
        }
        .mapalab-overlay a:hover, .mapalab-overlay button:hover {
            opacity: 0.9;
        }
        .mapalab-footer {
            position: absolute;
            bottom: 6px;
            right: 8px;
            font-size: 10px;
            color: rgba(0, 0, 0, 0.5);
            background: rgba(255, 255, 255, 0.8);
            padding: 2px 6px;
            border-radius: 4px;
            pointer-events: auto;
            z-index: 2;
        }
        .mapalab-footer a {
            color: inherit;
            text-decoration: none;
        }
        .mapalab-footer a:hover {
            text-decoration: underline;
        }
    `;

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
        this._reloadKey += 1;
        this.requestUpdate();
        this._scheduleTimeout();
    }

    _buildFallbackUrl() {
        const base = (this.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
        const params = new URLSearchParams();
        if (this.share) {
            params.set('s', this.share);
        } else if (this.layers) {
            params.set('layers', this.layers);
            if (this.center) params.set('center', this.center);
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
        if (this.basemap) params.set('basemap', this.basemap);
        if (this.controls) params.set('controls', this.controls);
        if (this.notices === 'false' || this.notices === false) params.set('notices', 'false');
        if (this._reloadKey) params.set('_r', String(this._reloadKey));
        return `${base}/embed?${params.toString()}`;
    }

    _onMessage(event) {
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
        const showFooter = !this._ready ? false : true;
        return html`
            <iframe
                src=${src}
                title=${this.title}
                allow="geolocation; fullscreen"
                referrerpolicy="strict-origin-when-cross-origin"
                loading="lazy"
            ></iframe>
            ${showFooter ? html`
                <div class="mapalab-footer" aria-hidden="true">
                    Fuente: <a href="https://iieg.gob.mx" target="_blank" rel="noopener">IIEG</a>
                </div>
            ` : ''}
        `;
    }
}
