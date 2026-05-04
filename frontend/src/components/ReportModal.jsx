import { useState, useId } from 'react';
import Modal from '@components/Modal';
import Icon from '@components/Icon';
import { submitReporte } from '@services/feedbackService';
import { trackReportSubmitted } from '@services/analyticsService';
import { useReportContext } from '@hooks/useReportContext';

const TIPOS = [
    { value: 'problema', label: 'Problema' },
    { value: 'solicitud', label: 'Solicitud' },
    { value: 'sugerencia', label: 'Sugerencia' },
    { value: 'duda', label: 'Duda' },
    { value: 'datos_incorrectos', label: 'Datos incorrectos' },
    { value: 'bug', label: 'Bug' },
];

const MENSAJE_MAX = 2000;

const canvasToBlob = (canvas) => new Promise((resolve) => {
    if (!canvas) return resolve(null);
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.92);
});

const ReportModal = ({ isOpen, onClose, extraContext, captureFn }) => {
    const buildContext = useReportContext();
    const [tipo, setTipo] = useState('problema');
    const [mensaje, setMensaje] = useState('');
    const [email, setEmail] = useState('');
    const [adjuntar, setAdjuntar] = useState(true);
    const [website, setWebsite] = useState('');
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const formId = useId();

    const reset = () => {
        setTipo('problema');
        setMensaje('');
        setEmail('');
        setAdjuntar(true);
        setWebsite('');
        setStatus('idle');
        setErrorMsg('');
    };

    const handleClose = () => {
        if (status === 'submitting') return;
        reset();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (website) return;
        if (mensaje.trim().length < 1) {
            setErrorMsg('Escribe un mensaje antes de enviar.');
            return;
        }

        setStatus('submitting');
        setErrorMsg('');

        let screenshotBlob = null;
        if (adjuntar && captureFn) {
            try {
                const canvas = await captureFn();
                screenshotBlob = await canvasToBlob(canvas);
            } catch {
                screenshotBlob = null;
            }
        }

        const ctx = buildContext(extraContext);

        try {
            await submitReporte({
                tipo,
                mensaje: mensaje.trim(),
                email: email.trim() || null,
                screenshotBlob,
                sourceApp: ctx.sourceApp,
                sourceRoute: ctx.sourceRoute,
                sourceContext: ctx.sourceContext,
            });
            trackReportSubmitted(tipo, ctx.sourceRoute);
            setStatus('success');
            setTimeout(() => handleClose(), 1800);
        } catch (err) {
            setStatus('error');
            if (err?.code === 'rate_limited') {
                const secs = err.retryAfter ?? 60;
                setErrorMsg(`Demasiados envíos. Intenta de nuevo en ${secs}s.`);
            } else {
                setErrorMsg('No pudimos enviar tu reporte. Inténtalo de nuevo en un momento.');
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Reportar" width="max-w-lg">
            {status === 'success' ? (
                <div className="px-6 py-10 flex flex-col items-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <Icon name="done" className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-base font-semibold text-gray-900">Reporte enviado</p>
                    <p className="text-sm text-gray-600">Gracias por ayudarnos a mejorar.</p>
                </div>
            ) : (
                <form id={formId} onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-2">Tipo</span>
                        <div className="grid grid-cols-2 gap-2">
                            {TIPOS.map(t => (
                                <label
                                    key={t.value}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${tipo === t.value ? 'border-[#5C2472] bg-[#5C2472]/5 text-[#5C2472]' : 'border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <input
                                        type="radio"
                                        name="tipo"
                                        value={t.value}
                                        checked={tipo === t.value}
                                        onChange={() => setTipo(t.value)}
                                        className="sr-only"
                                    />
                                    <span>{t.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor={`${formId}-mensaje`} className="block text-sm font-medium text-gray-700 mb-1">
                            Mensaje <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id={`${formId}-mensaje`}
                            value={mensaje}
                            onChange={(e) => setMensaje(e.target.value.slice(0, MENSAJE_MAX))}
                            rows={5}
                            required
                            placeholder="Cuéntanos qué encontraste o qué te gustaría sugerir."
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#5C2472] focus:ring-2 focus:ring-[#5C2472]/20 focus:outline-none resize-none"
                        />
                        <div className="text-right text-xs text-gray-400 mt-1">
                            {mensaje.length}/{MENSAJE_MAX}
                        </div>
                    </div>

                    <div>
                        <label htmlFor={`${formId}-email`} className="block text-sm font-medium text-gray-700 mb-1">
                            Email (opcional)
                        </label>
                        <input
                            id={`${formId}-email`}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Si quieres recibir respuesta"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#5C2472] focus:ring-2 focus:ring-[#5C2472]/20 focus:outline-none"
                        />
                    </div>

                    {captureFn && (
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={adjuntar}
                                onChange={(e) => setAdjuntar(e.target.checked)}
                                className="rounded border-gray-300 text-[#5C2472] focus:ring-[#5C2472]/30"
                            />
                            <span>Adjuntar captura de pantalla</span>
                        </label>
                    )}

                    <input
                        type="text"
                        name="website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                        className="absolute -left-[9999px] w-0 h-0"
                    />

                    {errorMsg && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                            {errorMsg}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={status === 'submitting'}
                            className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={status === 'submitting' || !mensaje.trim()}
                            className="px-4 py-2 rounded-lg text-sm bg-[#5C2472] text-white hover:bg-[#4a1d5c] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'submitting' ? 'Enviando…' : 'Enviar reporte'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default ReportModal;
