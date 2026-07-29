import { useState } from 'react';
import Modal from '@components/Modal';
import Icon from '@components/Icon';
import ScrollContainer from '@components/ScrollContainer';

const PROD_URL = 'https://iieg.jalisco.gob.mx/mapalab';
const STORAGE_KEY = 'test-env-modal-dismissed';
const IS_BETA = import.meta.env.VITE_APP_ENV === 'beta';

const readDismissed = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
};

const TestEnvModal = () => {
    const [open, setOpen] = useState(() => !readDismissed());
    const [dontShowAgain, setDontShowAgain] = useState(false);

    if (!IS_BETA) return null;

    const persistIfChecked = () => {
        if (!dontShowAgain) return;
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
        } catch {
            return;
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
            width="max-w-md"
            height="min-h-[640px] max-h-full"
            showHeader={false}
        >
            <div className="px-6 pt-6 pb-5 flex flex-col gap-4 h-full min-h-0 font-garet">
                <h3 className="flex items-center gap-3 text-xl font-bold text-gray-900 shrink-0 leading-none">
                    <Icon name="alert_triangle" className="w-7 h-7 text-orange-500 shrink-0" />
                    <span className="leading-none flex-1">Entorno de pruebas</span>
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Cerrar"
                        className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                    >
                        <Icon name="close" className="w-5 h-5" />
                    </button>
                </h3>

                <p className="text-gray-600 text-sm leading-relaxed shrink-0">
                    Hola, gracias por visitarnos. Estás navegando una versión de{' '}
                    <strong>pruebas</strong> de la plataforma, no el sitio oficial.
                    Aquí experimentamos antes de publicar cambios.
                </p>

                <ScrollContainer
                    as="ul"
                    className="flex-1 min-h-0 overflow-y-auto text-gray-600 text-sm leading-relaxed list-disc pl-5 space-y-1.5"
                    overlayFade
                    overlayColor="#ffffff"
                    showArrows={false}
                >
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
                    <li>
                        Al tratarse de un entorno de pruebas, opera sobre
                        infraestructura modesta, por lo que el rendimiento y los
                        tiempos de respuesta serán notablemente menores a los del
                        sitio oficial. Agradecemos tu paciencia.
                    </li>
                </ScrollContainer>

                <p className="text-gray-600 text-sm leading-relaxed shrink-0">
                    Si buscas información oficial, te invitamos a continuar en el
                    sitio oficial. Gracias por ayudarnos a mejorar.
                </p>

                <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none shrink-0">
                    <input
                        type="checkbox"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="accent-[#703089] w-4 h-4 cursor-pointer"
                    />
                    No volver a mostrar
                </label>

                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2 shrink-0">
                    <button
                        onClick={handleGoToProd}
                        className="px-6 py-2 rounded-full bg-[#703089] hover:bg-purple text-white font-semibold text-sm shadow-lg transition-colors cursor-pointer"
                    >
                        Ir a la página oficial
                    </button>
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 rounded-full bg-gray-50 text-gray-700 font-bold text-sm hover:shadow-lg border border-gray-200 transition-colors cursor-pointer"
                    >
                        Entendido, continuar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default TestEnvModal;
