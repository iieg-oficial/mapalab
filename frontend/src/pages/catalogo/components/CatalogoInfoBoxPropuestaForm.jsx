const FIELD = 'w-full text-[13px] text-[#454545] bg-[#F9FBFF] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple/40';
const LABEL = 'block text-[12px] font-bold text-purple mb-1';
const BTN = 'px-5 py-2 rounded-[30px] text-[13px] font-bold transition-colors cursor-pointer';

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
    onRegresar,
}) => (
    <div className="max-w-lg">
        <label className={LABEL} htmlFor="propuesta-comentario">¿Por qué propones este cambio?</label>
        <textarea
            id="propuesta-comentario"
            value={comentario}
            onChange={(e) => onComentario(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Cuéntanos qué información falta o qué haría más útil esta tarjeta."
            className={`${FIELD} mb-4`}
        />

        <label className={LABEL} htmlFor="propuesta-email">Correo (opcional)</label>
        <input
            id="propuesta-email"
            type="email"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            maxLength={255}
            placeholder="Para avisarte del resultado"
            className={FIELD}
        />

        <input
            type="text"
            value={website}
            onChange={(e) => onWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute opacity-0 pointer-events-none size-0"
        />

        {error && <p className="mt-3 text-[12px] text-[#B03A46]">{error}</p>}

        <div className="flex items-center gap-2 mt-6">
            <button
                type="button"
                onClick={onEnviar}
                disabled={enviando}
                className={`${BTN} bg-purple-deep text-white hover:bg-purple disabled:opacity-50`}
            >
                {enviando ? 'Enviando…' : 'Enviar propuesta'}
            </button>
            <button
                type="button"
                onClick={onRegresar}
                className={`${BTN} border border-purple-deep text-purple-deep hover:bg-purple-soft`}
            >
                Regresar
            </button>
        </div>
    </div>
);

export default CatalogoInfoBoxPropuestaForm;
