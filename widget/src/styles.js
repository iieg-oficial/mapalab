import { css } from 'lit';


export const widgetStyles = css`
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
`;
