import { useState } from 'react';
import Modal from '@components/Modal';
import Icon from '@components/Icon';

const PROD_URL = 'https://iieg.jalisco.gob.mx/mapalab';
const STORAGE_KEY = 'test-env-modal-dismissed';
const IS_BETA = import.meta.env.VITE_APP_ENV === 'beta';

const TestEnvModal = () => {
    const [open, setOpen] = useState(
        () => localStorage.getItem(STORAGE_KEY) !== 'true'
    );
    const [dontShowAgain, setDontShowAgain] = useState(false);

    if (!IS_BETA) return null;

    const persistIfChecked = () => {
        if (dontShowAgain) {
            localStorage.setItem(STORAGE_KEY, 'true');
        }
    };

    const handleClose = () => {
        persistIfChecked();
        setOpen(false);
    };

    const handleGoToProd = () => {
        persistIfChecked();
        window.location.href = PROD_URL;
    };

    return (
        <Modal
            isOpen={open}
            onClose={handleClose}
            title={
                <span className="flex items-center gap-2">
                    <Icon name="alert_triangle" className="w-5 h-5 text-orange-500" />
                    Entorno de pruebas
                </span>
            }
            width="max-w-md"
            showCloseButton={false}
        >
            <div className="px-6 py-5 flex flex-col gap-4">
                <p className="text-gray-600 text-sm leading-relaxed">
                    Hola, gracias por visitarnos. Estás navegando una versión de{' '}
                    <strong>pruebas</strong> de la plataforma, no el sitio oficial.
                    Aquí experimentamos antes de publicar cambios.
                </p>

                <ul className="text-gray-600 text-sm leading-relaxed list-disc pl-5 space-y-1.5">
                    <li>
                        Los datos pueden diferir de los oficiales mientras realizamos
                        validaciones internas.
                    </li>
                    <li>
                        Algunas secciones o herramientas pueden fallar, estar
                        incompletas o dejar de funcionar sin aviso.
                    </li>
                    <li>
                        Las funcionalidades nuevas que veas aquí pueden cambiar o no
                        llegar a publicarse.
                    </li>
                    <li>
                        Ningún contenido mostrado es oficial ni debe utilizarse para
                        tomar decisiones.
                    </li>
                </ul>

                <p className="text-gray-600 text-sm leading-relaxed">
                    Si buscas información oficial, te invitamos a continuar en el
                    sitio oficial. Gracias por ayudarnos a mejorar.
                </p>

                <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="accent-[#703089] w-4 h-4 cursor-pointer"
                    />
                    No volver a mostrar
                </label>

                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
                    <button
                        onClick={handleGoToProd}
                        className="px-6 py-2 rounded-full bg-[#703089] hover:bg-[#5C2472] text-white font-semibold text-sm shadow-lg transition-colors cursor-pointer"
                    >
                        Ir a la página oficial
                    </button>
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 rounded-full bg-white text-gray-700 bg-gray-50 font-bold text-sm hover:shadow-lg border border-gray-200 transition-colors cursor-pointer"
                    >
                        Entendido, continuar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default TestEnvModal;
