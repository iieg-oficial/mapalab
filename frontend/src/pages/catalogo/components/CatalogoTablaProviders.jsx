import { SiderContext } from '@contexts/SiderContext';
import { AreaUtilProvider } from '@contexts/AreaUtilContext';
import { TablaAtributosProvider } from '@contexts/TablaAtributosContext';
import TablaAtributos from '@pages/maps/components/TablaAtributos/TablaAtributos';

const SIDER_STUB = {
    siderRef: { current: null },
    toolsButtonRef: { current: null },
    width: 0,
    collapsedWidth: 0,
    expandedWidth: 0,
    isMobile: false,
    isOpen: false,
};

const LLAVE_PERSISTENCIA = 'mapalab.catalogo.tabla.estado';

const CatalogoTablaProviders = ({ tablasFijas, children }) => (
    <SiderContext.Provider value={SIDER_STUB}>
        <AreaUtilProvider>
            <TablaAtributosProvider
                tablasFijas={tablasFijas}
                llavePersistencia={LLAVE_PERSISTENCIA}
                acoplable={false}
            >
                {children}
                <TablaAtributos />
            </TablaAtributosProvider>
        </AreaUtilProvider>
    </SiderContext.Provider>
);

export default CatalogoTablaProviders;
