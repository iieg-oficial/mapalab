import Icon from '@components/Icon';
import ActionIconButton from '@components/ActionIconButton';
import { MobileSheetCloseButton } from '@components/MobileSheet';

const SIN_DINAMICAS = 'Esta capa tiene estadísticas capturadas a mano, no calculadas contra la base';

const AccionesPanel = ({ modos, modo, dinamica, onModo, onMinimizar, onCerrar, parte = 'todo' }) => (
    <>
        {parte !== 'ventana' && modos.map(item => (
            <ActionIconButton
                key={item.clave}
                onClick={() => onModo(item.clave)}
                activo={modo === item.clave}
                deshabilitado={!dinamica}
                titulo={dinamica
                    ? (modo === item.clave ? 'Volver al resumen' : item.titulo)
                    : SIN_DINAMICAS}
                etiqueta={item.etiqueta}
                tamano="lg"
            >
                <Icon name={item.icono} className="size-5" />
            </ActionIconButton>
        ))}

        {parte === 'todo' && <span className="w-px h-4 bg-[#DCE3F0] mx-0.5" />}

        {parte !== 'modos' && (
            <>
                <ActionIconButton
                    onClick={onMinimizar}
                    titulo="Minimizar estadísticas"
                    etiqueta="Minimizar el panel de estadísticas"
                    tamano="lg"
                >
                    <span className="block w-3.5 h-[2.5px] bg-current rounded-full" />
                </ActionIconButton>
                <span className="flex items-center">
                    <MobileSheetCloseButton onClick={onCerrar} />
                </span>
            </>
        )}
    </>
);

export default AccionesPanel;
