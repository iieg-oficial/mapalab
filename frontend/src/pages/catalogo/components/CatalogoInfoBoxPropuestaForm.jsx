import { BOTON_PRIMARIO, ERROR, ETIQUETA, INPUT, TEXTAREA } from '../helpers/controles';
import { IconoAlerta } from './tarjeta/iconos';

const CatalogoInfoBoxPropuestaForm = ({
    comentario,
    onComentario,
    email,
    onEmail,
    website,
    onWebsite,
    enviando,
    error,
    onEnviar,
}) => (
    <div className="flex flex-col gap-4">
        <div>
            <label className={ETIQUETA} htmlFor="propuesta-comentario">¿Por qué propones este cambio?</label>
            <textarea
                id="propuesta-comentario"
                value={comentario}
                onChange={(e) => onComentario(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Cuéntanos qué información falta o qué haría más útil esta tarjeta."
                className={TEXTAREA}
            />
        </div>

        <div>
            <label className={ETIQUETA} htmlFor="propuesta-email">Correo para avisarte (opcional)</label>
            <input
                id="propuesta-email"
                type="email"
                value={email}
                onChange={(e) => onEmail(e.target.value)}
                maxLength={255}
                autoComplete="email"
                placeholder="tu@correo.mx"
                className={INPUT}
            />
        </div>

        <input
            type="text"
            value={website}
            onChange={(e) => onWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute opacity-0 pointer-events-none size-0"
        />

        {error && <p className={ERROR}><IconoAlerta className="size-3.5 shrink-0" />{error}</p>}

        <div className="mt-2">
            <button type="button" onClick={onEnviar} disabled={enviando} className={BOTON_PRIMARIO}>
                {enviando ? 'Enviando…' : 'Enviar propuesta'}
            </button>
        </div>
    </div>
);

export default CatalogoInfoBoxPropuestaForm;
