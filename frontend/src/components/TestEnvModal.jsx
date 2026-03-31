import { useState, useEffect, useRef } from 'react';
import Modal from '@components/Modal';

const PROD_URL = 'https://iieg.jalisco.gob.mx/mapalab';
const STORAGE_KEY = 'test-env-modal-dismissed';
const COUNTDOWN_SECONDS = 15;

const TestEnvModal = () => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY) === 'true';
    const [open, setOpen] = useState(!dismissed);
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!open || dismissed || import.meta.env.VITE_APP_ENV !== 'beta') return;

        intervalRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    window.location.href = PROD_URL;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [open, dismissed]);

    if (import.meta.env.VITE_APP_ENV !== 'beta') return null;

    const handleClose = () => {
        clearInterval(intervalRef.current);
        if (dontShowAgain) {
            sessionStorage.setItem(STORAGE_KEY, 'true');
        }
        setOpen(false);
    };

    return (
        <Modal
            isOpen={open}
            onClose={handleClose}
            title="Entorno de pruebas"
            width="max-w-md"
            showCloseButton={false}
        >
            <div className="px-6 py-5 flex flex-col gap-4 text-center">
                <p className="text-gray-600 text-sm leading-relaxed">
                    Estás accediendo a una versión de <strong>pruebas</strong> de la
                    plataforma. Es posible que encuentres errores, datos incompletos
                    o funcionalidades en desarrollo.
                </p>

                <label className="flex items-center justify-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="accent-[#703089] w-4 h-4 cursor-pointer"
                    />
                    No volver a mostrar
                </label>

                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
                    {PROD_URL && (
                        <a
                            href={PROD_URL}
                            className="px-6 py-2 rounded-full bg-[#703089] hover:bg-[#5C2472] text-white font-semibold text-sm shadow-lg transition-colors"
                        >
                            Ir a la página oficial
                        </a>
                    )}
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 rounded-full bg-white text-gray-700 bg-gray-50 font-bold text-sm hover:shadow-lg border border-gray-200 transition-colors cursor-pointer"
                    >
                        Entendido, continuar
                    </button>
                </div>

                <p className="text-xs text-gray-400">
                    Serás redirigido a la página oficial en {countdown}s...
                </p>
            </div>
        </Modal>
    );
};

export default TestEnvModal;
