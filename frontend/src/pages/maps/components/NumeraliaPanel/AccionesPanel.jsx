import Icon from '@components/Icon';
import ActionIconButton from '@components/ActionIconButton';

const SIN_DINAMICAS = 'Esta capa tiene estadísticas capturadas a mano, no calculadas contra la base';

const AccionesPanel = ({ modos, modo, dinamica, onModo, onMinimizar, onCerrar }) => (
    <>
        {modos.map(item => (
            <ActionIconButton
                key={item.clave}
                onClick={() => onModo(item.clave)}
                activo={modo === item.clave}
                deshabilitado={!dinamica}
                titulo={dinamica
                    ? (modo === item.clave ? 'Volver al resumen' : item.titulo)
                    : SIN_DINAMICAS}
                etiqueta={item.etiqueta}
                tamano="sm"
            >
                <Icon name={item.icono} className="size-3.5" />
            </ActionIconButton>
        ))}

        <span className="w-px h-3 bg-[#DCE3F0] mx-0.5" />

        <ActionIconButton
            onClick={onMinimizar}
            titulo="Minimizar estadísticas"
            etiqueta="Minimizar el panel de estadísticas"
            tamano="sm"
        >
            <span className="block w-2.5 h-[2px] bg-current rounded-full" />
        </ActionIconButton>

        <ActionIconButton
            onClick={onCerrar}
            titulo="Cerrar estadísticas"
            etiqueta="Cerrar el panel de estadísticas"
            tamano="sm"
        >
            <Icon name="close" className="size-3.5" />
        </ActionIconButton>
    </>
);

export default AccionesPanel;
