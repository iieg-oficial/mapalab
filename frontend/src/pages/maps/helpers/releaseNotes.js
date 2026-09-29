import { APP_VERSION } from '@constants/app';

export const CURRENT_VERSION = APP_VERSION;

export const RELEASE_TAGS = {
    added: { label: 'Agregado', color: '#22c55e' },
    fixed: { label: 'Corregido', color: '#3b82f6' },
    changed: { label: 'Cambiado', color: '#FF8300' },
    removed: { label: 'Eliminado', color: '#ef4444' },
    perf: { label: 'Rendimiento', color: '#8b5cf6' }
};

const FALLBACK_NOTES = [
    {
        version: '2.0.0',
        items: [
            { text: 'Vista 3D del mapa: el relieve de Jalisco con tus capas encima, los puntos de pie y los municipios levantados. Funciona también con la barra divisora y en el Catálogo, y los enlaces que compartes se abren en 3D.', tag: 'added' },
            { text: 'Modo dron (BETA): recorre Jalisco desde el aire en ocho aeronaves distintas y descarga la imagen de tu recorrido. También puedes simular lluvia e inundación.', tag: 'added' },
            { text: 'Tabla de datos: consulta los registros de una capa, fíltralos por columna, selecciona varios y descarga lo que estás viendo.', tag: 'added' },
            { text: 'Panel de estadísticas con comparador de municipios, ranking estatal, gráficas y estadísticas armadas por ti.', tag: 'added' },
            { text: 'Las capas de puntos se pueden ver agrupadas en hexágonos.', tag: 'added' },
            { text: 'Al seleccionar un área ves cuántos elementos hay, sumas, promedios y el reparto por clase, y puedes descargar solo lo seleccionado.', tag: 'added' },
            { text: 'Mediciones sobre el terreno en 3D, con perfil de alturas.', tag: 'added' },
            { text: 'Minimapa (BETA): actívalo en Herramientas para ver en qué parte de Jalisco estás cuando te acercas.', tag: 'added' },
            { text: 'Ahora puedes girar el mapa con clic derecho y volver al norte con la brújula.', tag: 'added' },
            { text: 'El panel de Herramientas estrena íconos.', tag: 'changed' },
        ],
    },
    {
        version: '1.96.0',
        items: [
            { text: 'En el Catálogo ya puedes proponer cómo se ve la tarjeta de información de una capa: eliges qué datos aparecen y en qué orden, con vista previa en vivo. Tu propuesta pasa a revisión del IIEG antes de publicarse.', tag: 'added' },
        ],
    },
    {
        version: '1.94.0',
        items: [
            { text: 'La tarjeta de información del Catálogo ahora se queda anclada al punto que consultaste aunque muevas o acerques el mapa, y estrena botones para centrar la selección, descargar las tarjetas y moverla de lugar.', tag: 'added' },
            { text: 'Desde el celular, esa tarjeta se abre como panel inferior y puedes descartar cada resultado deslizándolo.', tag: 'added' },
            { text: 'La lista de instituciones ya se muestra completa cuando tienes «Todas» seleccionada; antes se alcanzaban a ver solo dos.', tag: 'fixed' },
            { text: 'En el celular, la barra de fechas del Catálogo se movió debajo del botón de regresar para que no la tape el logo, y el panel de leyendas aprovecha mejor el espacio.', tag: 'changed' },
        ],
    },
    {
        version: '1.93.1',
        items: [
            { text: 'En el Catálogo desde el celular, el panel de leyendas ahora se abre a todo el ancho de la pantalla y trae su botón para minimizarlo.', tag: 'changed' },
        ],
    },
    {
        version: '1.93.0',
        items: [
            { text: 'Los controles de fecha y animación ahora se ven morados mientras están en su estado normal y se ponen naranjas en cuanto los usas o cambias su configuración, para que sea evidente qué tienes activo.', tag: 'changed' },
            { text: 'Mientras corre una animación, el mes o el año que se está mostrando ya se resalta en el panel de fechas abierto.', tag: 'fixed' },
            { text: 'Al regresar de los meses a la vista de años ya no se pierde el filtro: queda seleccionado el año completo del que venías.', tag: 'fixed' },
            { text: 'En el Catálogo, cuando el filtro abarca más de tres meses la fecha se resume («Enero a Mayo de 2024») en vez de enlistarlos todos, y el botón para quitar el filtro ahora es un bote de basura.', tag: 'changed' },
        ],
    },
    {
        version: '1.92.0',
        items: [
            { text: 'Al descargar capas pesadas, el navegador ahora te pregunta dónde guardar el archivo y lo escribe directo en tu equipo, en vez de cargarlo completo en memoria; así se evita que se sature con archivos grandes. (Disponible en Chrome y Edge de computadora.)', tag: 'added' },
        ],
    },
    {
        version: '1.91.0',
        items: [
            { text: 'Corregimos la descarga de capas en CSV, que en algunos casos se bloqueaba: ahora baja siempre como un archivo .csv listo para abrir.', tag: 'fixed' },
            { text: 'Los enlaces a las fichas de metadatos (TXT y Excel) de cada capa vuelven a abrir correctamente.', tag: 'fixed' },
        ],
    },
    {
        version: '1.90.0',
        items: [
            { text: 'Al recargar la página, el visor vuelve a dejar seleccionada la capa que tenías, no la primera de la lista.', tag: 'fixed' },
            { text: 'Las descargas en CSV ya nunca incluyen la columna de geometría, sin importar desde dónde las bajes (botón directo, con filtros o desde el Catálogo).', tag: 'fixed' },
            { text: 'Mientras se descarga una capa ahora también se muestra el tiempo transcurrido.', tag: 'added' },
        ],
    },
    {
        version: '1.89.0',
        items: [
            { text: 'En el Catálogo, al descargar o compartir una capa se respeta la fecha que tienes puesta: el archivo trae solo esos datos y el enlace o QR abre la capa en esa misma fecha.', tag: 'added' },
            { text: 'En el Catálogo, las capas de imágenes satelitales o de clima con varias fechas ya se pueden animar y filtrar por mes, igual que las demás.', tag: 'added' },
            { text: 'La leyenda ahora oculta las clases que no tienen datos en la fecha seleccionada, tanto en el Catálogo como en el visor, para que muestre solo lo que estás viendo en el mapa.', tag: 'changed' },
        ],
    },
    {
        version: '1.87.0',
        items: [
            { text: 'Los archivos CSV ya no incluyen la columna de geometría: pesan una fracción de lo que pesaban y se abren en Excel con las columnas en su lugar. Antes, esa columna era tan larga que Excel recorría los datos y la fecha aparecía fuera de sitio.', tag: 'fixed' },
            { text: 'Descargar "por fecha activa" ahora respeta la fecha que tienes seleccionada. Antes se descargaba la capa completa sin avisar, y en GeoPackage y Shapefile la fecha se ignoraba.', tag: 'fixed' },
            { text: 'Al descargar una capa desde el panel de capas activas se despliega el avance de la descarga, con el porcentaje y el tamaño cuando se conocen, y un botón para cancelar.', tag: 'added' },
        ],
    },
    {
        version: '1.86.0',
        items: [
            { text: 'Ahora puedes compartir una capa del Catálogo con un enlace o con un código QR que lleva el logo de Mapalab al centro, y descargarlo como imagen.', tag: 'added' },
            { text: 'Las capas del Catálogo se pueden agrupar por institución: elige una en las pastillas del buscador para ver solo sus capas, y comparte ese catálogo con enlace o QR.', tag: 'added' },
        ],
    },
    {
        version: '1.84.2',
        items: [
            { text: 'La lista de capas del Catálogo ahora indica con un degradado y flechas cuando hay más capas por ver, y se desplaza sin barra a la vista.', tag: 'changed' },
        ],
    },
    {
        version: '1.84.1',
        items: [
            { text: 'En el Catálogo, las herramientas de medición y anotación ahora se muestran u ocultan con un botón; al cerrarlas se borran los trazos que hiciste.', tag: 'changed' },
            { text: 'Las leyendas del Catálogo ahora se ven consistentes con las del visor y quedan mejor alineadas.', tag: 'fixed' },
        ],
    },
    {
        version: '1.84.0',
        items: [
            { text: 'En el Catálogo ahora puedes medir distancias y áreas, y anotar sobre el mapa con texto, emojis y trazos libres desde un botón; se despliegan al activarlo y puedes gestionarlos en una lista.', tag: 'added' },
            { text: 'En el Catálogo, al hacer clic sobre la capa se muestra una tarjeta con la información del elemento consultado.', tag: 'added' },
        ],
    },
    {
        version: '1.79.0',
        items: [
            { text: 'Agregamos un sombreado de relieve que resalta la topografía del estado por encima del mapa; permanece visible mientras haya un mapa base y se adapta automáticamente a la vista IIEG o INEGI.', tag: 'added' },
        ],
    },
    {
        version: '1.78.1',
        items: [
            { text: 'Corregimos los íconos del menú lateral, que se veían comprimidos al colapsar el panel; ahora mantienen su tamaño en todo momento.', tag: 'fixed' },
        ],
    },
    {
        version: '1.78.0',
        items: [
            { text: 'Las capas nuevas o actualizadas ahora muestran una etiqueta ("Nueva", "Actualizada") junto a su nombre en el menú, el buscador y tus capas activas.', tag: 'added' },
            { text: 'El tema que tiene una capa nueva muestra un puntito de aviso; al abrir y activar esa capa, el puntito desaparece y no te vuelve a aparecer.', tag: 'added' },
        ],
    },
    {
        version: '1.76.0',
        items: [
            { text: 'Cuando haces clic y la capa seleccionada no tiene datos en ese punto, el mensaje ahora es más claro y muestra el símbolo de la capa para que sepas cuál estás consultando.', tag: 'changed' },
            { text: 'Las capas sugeridas con datos en el punto ahora muestran su símbolo junto al nombre.', tag: 'added' },
            { text: 'En computadora, al pasar el mouse sobre una capa sugerida se resalta en el mapa para que veas cuál es antes de elegirla.', tag: 'added' },
        ],
    },
    {
        version: '1.75.0',
        items: [
            { text: 'En celular, al elegir una herramienta de medición o anotación las demás se ocultan para mostrar sus controles, y al terminar el trazo vuelven a aparecer todas.', tag: 'changed' },
            { text: 'En celular, los controles de cada herramienta (deshacer/terminar/cancelar, color y grosor) ahora son los mismos que en computadora.', tag: 'changed' },
            { text: 'El botón de eventos ya no se encima con tus herramientas, ni siquiera al recargar la página teniendo trazos guardados.', tag: 'fixed' },
        ],
    },
    {
        version: '1.73.0',
        items: [
            { text: 'Longitud por segmento: activa esta opción en el engrane de "Mis mediciones" para ver la distancia de cada tramo entre vértices.', tag: 'added' },
            { text: 'Los polígonos ahora muestran área + perímetro en su etiqueta.', tag: 'added' },
            { text: 'Selector de unidades: elige m, km, m², ha o km² para tus mediciones desde el nuevo panel de configuración.', tag: 'added' },
        ],
    },
    {
        version: '1.72.0',
        items: [
            { text: 'Mediciones y anotaciones: ahora se conservan al recargar la página. Tus trazos, textos y emojis ya no desaparecen con un refresh; para borrarlos usa la X de cerrar herramientas.', tag: 'added' },
            { text: 'Texto y emojis: el color, el fondo y el tamaño que eliges ahora se conservan al compartir el mapa y al recargar.', tag: 'fixed' },
            { text: 'Anotaciones: el texto compartido vuelve a verse como texto (antes podía mostrarse con estilo de emoji) y se puede volver a rotar y redimensionar después de cargarlo.', tag: 'fixed' },
            { text: 'Herramientas: los colores de líneas, polígonos, selección y trazo libre se ajustaron a los colores oficiales del instituto.', tag: 'changed' },
        ],
    },
    {
        version: '1.64.1',
        items: [
            { text: 'Barra de herramientas: el botón de descarga ahora muestra su nombre completo "Descargar visualización" y la barra se ajusta a su contenido cuando hay espacio disponible.', tag: 'changed' },
        ],
    },
    {
        version: '1.64.0',
        items: [
            { text: 'Capas activas: al seleccionar una capa, el mapa se acomoda solo para mostrarla sin que los paneles laterales la tapen.', tag: 'added' },
            { text: 'Capas activas: la capa seleccionada se resalta un momento mientras las demás se atenúan, para que la ubiques más rápido en el mapa.', tag: 'added' },
            { text: 'Capas activas: ahora puedes tocar la leyenda de una capa para llevar el mapa directamente a ella.', tag: 'added' },
        ],
    },
    {
        version: '1.58.1',
        items: [
            { text: 'Compartir mapa: para recargar la configuración del compartido ahora se hace click directamente sobre la etiqueta verde, sin botón aparte.', tag: 'changed' },
            { text: 'Vista por municipio: para centrar el mapa en el municipio activo ahora se hace click directamente sobre la etiqueta con el nombre del municipio, sin botón aparte.', tag: 'changed' },
        ],
    },
    {
        version: '1.58.0',
        items: [
            { text: 'Compartir mapa: un click rápido al botón Compartir ahora genera el enlace y lo copia al portapapeles automáticamente. Para abrir el panel con todas las opciones, mantén presionado el botón.', tag: 'changed' },
            { text: 'Compartir mapa: cuando estás viendo un mapa compartido, aparece una etiqueta verde con dos acciones: recargar la configuración original del compartido y desligarte del compartido sin recargar.', tag: 'added' },
            { text: 'Compartir mapa: en celular, tocar el botón mientras ves un compartido te desliga del mismo (igual que la X en escritorio).', tag: 'added' },
            { text: 'Compartir mapa: corregido un error en celular donde el mapa no se centraba en la zona del compartido al abrir el enlace.', tag: 'fixed' },
            { text: 'Compartir mapa: corregido un error donde a veces el enlace compartido no aplicaba las capas al abrir.', tag: 'fixed' },
        ],
    },
    {
        version: '1.57.1',
        items: [
            { text: 'Información del punto: cuando la capa seleccionada no tiene datos en el punto, ahora se muestran correctamente las demás capas activas que sí los tienen como alternativas.', tag: 'fixed' },
        ],
    },
    {
        version: '1.56.0',
        items: [
            { text: 'Eventos: nuevo botón para compartir un evento con un enlace permanente que siempre lo abre tal como está configurado.', tag: 'added' },
            { text: 'Capas activas: al eliminar todas las capas, el enlace se limpia para volver al estado inicial del visor.', tag: 'changed' },
        ],
    },
    {
        version: '1.55.0',
        items: [
            { text: 'Mapa base: corregido un destello blanco que aparecía al acercar o alejar el mapa a cierto nivel de zoom.', tag: 'fixed' },
        ],
    },
    {
        version: '1.52.0',
        items: [
            { text: 'Detalle de capa: una capa ahora puede mostrar varias fuentes y varias metodologías cuando aplica.', tag: 'added' },
        ],
    },
    {
        version: '1.50.1',
        items: [
            { text: 'Corregido un caso donde el mapa base se veía en blanco al centrar la vista sobre un punto individual.', tag: 'fixed' },
        ],
    },
    {
        version: '1.49.2',
        items: [
            { text: 'Compartir mapa: el panel ahora se abre justo debajo del botón, sin tapar el mapa, y se ajusta a su contenido.', tag: 'changed' },
            { text: 'Compartir mapa: las opciones de "enlace" e "insertar en otro sitio" aparecen desde el inicio como pestañas; ya no es necesario dar un click previo para verlas.', tag: 'changed' },
            { text: 'Compartir mapa: la opción de insertar el mapa en otro sitio queda marcada como beta para que sepas que sigue en pruebas.', tag: 'added' },
        ],
    },
    {
        version: '1.47.0',
        items: [
            { text: 'Recuadro de información del punto: ahora se puede mover arrastrando el nuevo botón con las 4 flechas en cruz. Útil cuando el recuadro tapa un punto del mapa que quieres ver.', tag: 'added' },
            { text: 'Recuadro de información del punto: la flecha que apunta al feature ahora se reposiciona automáticamente cuando arrastras el recuadro o mueves el mapa, manteniendo siempre la conexión visual con el punto que seleccionaste.', tag: 'changed' },
            { text: 'Recuadro de información del punto: nuevo botón "Centrar selección" que hace zoom al área de los features seleccionados.', tag: 'added' },
            { text: 'Visor: al hacer clic en una feature, su geometría se resalta automáticamente sobre el mapa con un color suave (morado por defecto). Los administradores pueden cambiar el color y la forma del resaltado por capa desde el panel de administración.', tag: 'added' },
            { text: 'Recuadro de información del punto: cuando la flecha conecta con el encabezado del recuadro, ahora se ve continua con el mismo color de fondo, sin línea visible.', tag: 'changed' },
        ],
    },
    {
        version: '1.40.2',
        items: [
            { text: 'Eventos: el menú que se abre desde el botón flotante (a la derecha del menú lateral) ya muestra scroll cuando su contenido es más alto que la pantalla. Antes podía cortarse al final sin aviso.', tag: 'fixed' },
            { text: 'Eventos: ahora viven solo en el botón flotante a la derecha del menú lateral. Quitamos la sección de eventos que también aparecía dentro del menú lateral para evitar duplicidad.', tag: 'changed' },
        ],
    },
    {
        version: '1.38.3',
        items: [
            { text: 'Recuadro de información del punto: ya no queda escondido detrás de los textos, emojis o marcadores que dibujas sobre el mapa. Subimos su nivel para que siempre se vea encima de esos elementos, pero sigue debajo de los paneles del visor.', tag: 'fixed' },
        ],
    },
    {
        version: '1.38.2',
        items: [
            { text: 'Recuadro de información del punto: ya no se sobrepone a la lista de Capas Activas, al menú lateral ni al panel de Detalles. Antes podía taparlos cuando aparecía cerca del borde de esos paneles.', tag: 'fixed' },
        ],
    },
    {
        version: '1.38.0',
        items: [
            { text: 'Eventos: ahora desde el admin de mariachi se puede definir explícitamente qué capa va encima de otra en el mapa (campo "Z" en la tabla de capas del evento). Si no se define nada, las capas se acomodan en el orden natural (las últimas de la lista quedan arriba).', tag: 'changed' },
        ],
    },
    {
        version: '1.37.3',
        items: [
            { text: 'Detalle de capa: al abrir el panel de detalles, ya queda por encima del recuadro de información del punto. Antes el recuadro lo tapaba cuando ambos estaban abiertos al mismo tiempo.', tag: 'fixed' },
        ],
    },
    {
        version: '1.37.2',
        items: [
            { text: 'Capas activas: cuando una capa seleccionada se queda fija al borde del panel (con su periodicidad, acciones y leyenda visibles), las flechas para ir al inicio o al final del listado ya quedan visibles arriba o abajo del item, no escondidas detrás de él. El degradado de los bordes también se ajusta solo al tamaño real del item, incluso cuando la leyenda termina de cargar y crece.', tag: 'fixed' },
        ],
    },
    {
        version: '1.37.1',
        items: [
            { text: 'Detalle del punto (InfoBox): ya no se muestra el contador "1/1" cuando solo hay un resultado en la tarjeta. El número solo aparece cuando hay más de un punto en el mismo lugar.', tag: 'changed' },
        ],
    },
    {
        version: '1.37.0',
        items: [
            { text: 'Detalle del punto (InfoBox): algunos campos pueden mostrarse ahora como enlaces que abren en una pestaña nueva (por ejemplo, fichas en otros sitios). El visor solo permite enlaces hacia páginas web, correos o teléfonos; cualquier otra cosa se ignora por seguridad.', tag: 'added' },
        ],
    },
    {
        version: '1.36.0',
        items: [
            { text: 'Eventos: la barra de acciones del evento (switch "Solo este evento", dato curioso, etc.) ya está disponible para todos, no solo en la versión de pruebas.', tag: 'changed' },
            { text: 'Eventos: nuevo botón "Centrar evento" que vuelve a encuadrar el mapa sobre el área del evento cuando lo necesites.', tag: 'added' },
            { text: 'Eventos: si abres un evento y ya tienes alguna de sus capas activa, el visor ya no vuelve a mover el mapa ni a reactivar las capas que apagaste — respeta lo que tenías. Para volver a centrar, usa el botón "Centrar evento".', tag: 'changed' },
            { text: 'Eventos: quitamos el botón de copiar enlace del evento dentro de la barra de acciones.', tag: 'removed' },
            { text: 'Eventos: al abrir un evento, las capas se acomodan en el panel "Capas activas" en el mismo orden en que están en el submenú del evento (la primera del submenú queda al frente del mapa).', tag: 'fixed' },
        ],
    },
    {
        version: '1.32.0',
        items: [
            { text: 'Eventos: nueva barra de acciones dentro de cada evento (sólo visible en beta) con tres novedades: un switch "Solo este evento" que oculta automáticamente las capas que no pertenecen al evento mientras esté encendido; un botón para copiar el enlace del evento (que abre el visor directamente con ese evento desplegado); y un botón para reportar un problema con datos del evento.', tag: 'added' },
            { text: 'Eventos: botón lúdico de "dato curioso" — al presionarlo cae un balón animado que rebota hasta el fondo y, cuando se detiene, aparece arriba un mensaje con un dato curioso del evento. Cada evento puede tener su propia lista de datos (configurables desde el admin) y su propio ícono (no tiene que ser un balón).', tag: 'added' },
            { text: 'Eventos: ahora puedes abrir un evento directamente desde una URL como /mapa?evento=mundial. El visor reconoce el slug o el ID del evento y abre su menú al cargar.', tag: 'added' },
            { text: 'Eventos: cada evento puede forzar un mapa base específico al abrirse (por ejemplo, mostrar siempre "Sin mapa base" si el evento se ve mejor sobre fondo blanco). Al cerrar el evento, el mapa base regresa al que tenías antes.', tag: 'added' },
        ],
    },
    {
        version: '1.30.0',
        items: [
            { text: 'Eventos ya no es BETA: quitamos la etiqueta naranja del ícono porque la sección está lista para uso general.', tag: 'changed' },
            { text: 'Eventos: los eventos ahora pueden organizar sus capas en sub-categorías (carpetas expandibles), para temas con muchas capas relacionadas.', tag: 'added' },
            { text: 'Detalle de capa: el scrollbar del modal ya se ve igual que en el resto del visor, en lugar del estilo por defecto del navegador.', tag: 'fixed' },
            { text: 'Eventos: corregimos un caso en que activar un evento dejaba 4 capas rotas en el bundle WMS y aparecía un error de imagen en consola. Ahora el visor sólo carga las capas válidas.', tag: 'fixed' },
        ],
    },
    {
        version: '1.29.0',
        items: [
            { text: 'Algunas capas ahora pueden mostrar un mensaje informativo arriba del mapa (con título, descripción opcional, icono y un posible enlace). Aparece sólo cuando la capa está activa y dentro de su zoom recomendado; puedes cerrarlo si te estorba.', tag: 'added' },
        ],
    },
    {
        version: '1.27.0',
        items: [
            { text: 'Ahora MapaLab cuenta de forma anónima cuántas personas usan cada capa y herramienta, para priorizar mejoras donde más se necesitan. No se identifica a ningún usuario; si tu navegador tiene "No me rastrees" activado, se respeta automáticamente.', tag: 'added' },
        ],
    },
    {
        version: '1.21.1',
        items: [
            { text: 'Los límites estatales, regionales y municipales (IIEG e INEGI) ahora se muestran automáticamente arriba de cualquier capa de polígono activa, para que sus etiquetas no queden tapadas. En el panel de capas activas verás un ícono de pin en estas capas indicando que se mantienen siempre visibles.', tag: 'added' },
        ],
    },
    {
        version: '1.20.3',
        items: [
            { text: 'Panel de capas activas: ya no se traslapa con la barra de "Contribuciones" cuando tienes muchas capas y el panel crece al alto completo de la pantalla.', tag: 'fixed' },
        ],
    },
    {
        version: '1.20.2',
        items: [
            { text: 'Eventos: al abrir un evento, el visor vuelve a centrar el mapa en el área del evento y a prender automáticamente las capas marcadas como "auto-activar", aunque ya hayas abierto ese mismo evento antes en la sesión.', tag: 'fixed' },
        ],
    },
    {
        version: '1.20.1',
        items: [
            { text: 'Comparador: ahora puedes mover la barra divisoria con el teclado (flechas, Inicio/Fin) y leerla con un lector de pantalla.', tag: 'added' },
            { text: 'Comparador: la orientación que elijas (vertical u horizontal) se recuerda para la próxima vez que abras el comparador.', tag: 'added' },
            { text: 'Comparador: al activar una capa con fecha por defecto, ahora se aplica correctamente al iniciar la comparación.', tag: 'fixed' },
            { text: 'Comparador: los mapas son más eficientes al entrar y salir, evitando cargas innecesarias.', tag: 'perf' },
            { text: 'Comparador: si recargas la página, el orden de las capas y la orientación se respetan al restaurar el estado compartido.', tag: 'fixed' },
        ],
    },
    {
        version: '1.20.0',
        items: [
            { text: 'Los eventos ahora abren y muestran sus capas más rápido al recargar el visor.', tag: 'perf' },
            { text: 'Si apagas una capa de un evento y luego cierras y vuelves a abrir el evento, esa capa ya no se vuelve a prender automáticamente durante la misma sesión.', tag: 'changed' },
            { text: 'Al reabrir un evento ya no se vuelve a centrar el mapa al área del evento (respeta dónde te dejaste).', tag: 'changed' },
        ],
    },
    {
        version: '1.18.0',
        items: [
            { text: 'Al presionar el logotipo del IIEG, ahora se muestran estadísticas dinámicas de la base de datos (capas, registros y líneas de código).', tag: 'added' },
            { text: 'Mejora en el comparador: al hacer zoom, click o centrar el mapa, los eventos ahora se aplican correctamente al lado correspondiente (A o B).', tag: 'changed' },
            { text: 'Los controles de animación de tiempo ahora son siempre visibles directamente desde el panel de capas activas cuando están disponibles.', tag: 'added' },
            { text: 'El logotipo de MapaLab en celulares ahora se adapta mejor a la pantalla y la información en la página principal se reorganizó a una sola columna.', tag: 'changed' },
            { text: 'Mejoras en el posicionamiento de buscadores (SEO) para ayudar a que la plataforma se encuentre más fácilmente en internet.', tag: 'added' },
            { text: 'Se limpió la interfaz quitando el botón "Reportar" dentro de las tarjetas de información para darle más espacio al contenido.', tag: 'changed' }
        ]
    },
    {
        version: '1.17.0',
        items: [
            { text: 'Nuevo botón "Reportar" para enviar problemas, dudas o sugerencias desde el mapa, el InfoBox, el marker de IIEG y el footer de la página principal', tag: 'added' },
            { text: 'Al reportar desde el mapa, puedes adjuntar una captura de pantalla automática para darnos más contexto', tag: 'added' },
            { text: 'El email es opcional: si lo dejas en blanco, tu reporte llega de forma anónima', tag: 'added' },
        ]
    },
    {
        version: '1.16.0',
        items: [
            { text: 'Nuevo botón Descargar dentro del panel de cada capa activa: abre el menú de opciones de descarga sin tener que entrar al detalle', tag: 'added' },
            { text: 'Mientras la leyenda de una capa carga, ahora aparece un pequeño logo animado en lugar de un espacio vacío', tag: 'added' },
            { text: 'En el comparador, los tooltips de cada acción te indican de qué lado (A o B) estás trabajando', tag: 'added' },
            { text: 'En el comparador, ahora puedes mover el orden de las capas aunque estén en lados distintos', tag: 'added' },
            { text: 'El botón de cerrar comparador se separó de la barra de fechas y ahora pide confirmación antes de cerrar', tag: 'changed' },
            { text: 'Ya puedes ver la barra de escala correctamente cuando estás en el comparador', tag: 'fixed' },
            { text: 'Al activar la primera capa, la sección de fechas (periodicidad) ya aparece de inmediato en el detalle', tag: 'fixed' },
            { text: 'Al ciclar la pildora A/B/AB ya no se "deselecciona" la capa que estabas viendo', tag: 'fixed' },
            { text: 'La opacidad y la visibilidad de un grupo de capas ahora sí se conservan al refrescar la página', tag: 'fixed' },
            { text: 'En el comparador, el botón Eliminar quita la capa de los dos lados a la vez (para mover entre lados se usa la pildora A|B)', tag: 'changed' },
            { text: 'Los contadores del header del panel ahora muestran el número real de capas visibles, no de IDs internos', tag: 'fixed' },
        ]
    },
    {
        version: '1.14.0',
        items: [
            { text: 'Cada capa activa se rediseñó con un layout en filas: arriba el título, abajo la fecha + animación + insignia A/B, después los botones de acciones y al final la leyenda', tag: 'changed' },
            { text: 'Nuevo botón de opacidad: muestra el porcentaje en el mismo botón cuando es distinto a 100 % y abre una barra deslizable al hacer click', tag: 'added' },
            { text: 'La leyenda de cada capa aparece dentro de su propia tarjeta en el panel de capas activas (antes vivía en un panel aparte)', tag: 'added' },
            { text: 'Nuevo botón para mostrar u ocultar las leyendas; tu preferencia se recuerda entre sesiones', tag: 'added' },
            { text: 'En el comparador, al cambiar entre lado A y B se ilumina brevemente el panel correspondiente', tag: 'added' },
            { text: 'Los controles de animación (play / velocidad / dirección) sólo aparecen cuando ya hay una animación corriendo: se inicia desde "Ver animación" del detalle de la capa', tag: 'changed' },
            { text: 'Quitamos el aviso emergente al activar la barra divisora: la información ahora aparece como tooltip sobre el botón', tag: 'changed' },
            { text: 'Quitamos la letra A o B gigante en el centro al cambiar de lado en el comparador; conservamos el resaltado del panel', tag: 'removed' },
        ]
    },
    {
        version: '1.11.0',
        items: [
            { text: 'Al hacer click en zonas con muchos puntos, el panel de información ahora muestra el total real desde el primer momento (por ejemplo "1/482" en lugar de "1/50")', tag: 'changed' },
            { text: 'Carga progresiva de tarjetas: las primeras 50 aparecen al instante y se van cargando 50 más conforme deslizas hasta el final del panel', tag: 'added' },
            { text: 'Botón Descargar (escritorio): nuevo distintivo con el número total de tarjetas y descripción detallada al pasar el cursor', tag: 'added' },
            { text: 'Al eliminar una tarjeta con la X, el contador y la descarga se ajustan automáticamente para no incluirla', tag: 'added' },
            { text: 'Encabezado del detalle de capa: el tema y su ícono ahora se determinan correctamente desde la jerarquía del árbol de capas', tag: 'fixed' },
            { text: 'Título del encabezado de cada tarjeta queda centrado horizontalmente aunque el contador sea muy largo', tag: 'fixed' },
        ]
    },
    {
        version: '1.10.0',
        items: [
            { text: 'Etiquetas visuales BETA / NUEVA / DEV / TEST para indicar el estado de funciones (componente reutilizable)', tag: 'added' },
            { text: 'Boton "Comparar fechas" como vista previa en el modal de Compartir (proximamente disponible)', tag: 'added' },
        ]
    },
    {
        version: '1.9.0',
        items: [
            { text: 'Compartir mapa: el boton ahora genera un enlace corto que recuerda el estado completo (capas activas, orden, filtros, opacidad, fechas, basemap, posicion)', tag: 'changed' },
            { text: 'Boton "Fijar 1 ano" en el modal de compartir para que el enlace no expire por inactividad', tag: 'added' },
            { text: 'Los enlaces compartidos no fijados se conservan 30 dias desde el ultimo acceso', tag: 'added' },
        ]
    },
    {
        version: '1.8.0',
        items: [
            { text: 'Las capas ahora tienen identificadores publicos legibles que aparecen en la URL (por ejemplo "establecimientos-salud" en lugar de IDs internos)', tag: 'changed' },
            { text: 'Acceso directo a una capa con un link tipo "?layer=establecimientos-salud" — abre el mapa con esa capa activa', tag: 'added' },
            { text: 'Cada capa puede tener atajos cortos opcionales (aliases). Por ejemplo "?layer=esalud" tambien funciona', tag: 'added' },
        ]
    },
    {
        version: '1.7.0',
        items: [
            { text: 'Editor de capas: reordenar capas del árbol arrastrándolas (drag & drop) entre hermanos del mismo grupo', tag: 'added' },
            { text: 'Editor de capas: preview del InfoBox con datos de ejemplo al seleccionar un preset', tag: 'added' },
            { text: 'Editor de capas: formulario dinámico que muestra solo los campos que aplican al preset elegido', tag: 'added' },
            { text: 'Editor de capas: editor de JSON libre para el preset "custom"', tag: 'added' },
            { text: 'Observabilidad: endpoints /metrics en formato Prometheus para monitoreo centralizado', tag: 'added' },
            { text: 'Limpieza de arquitectura interna: removida la dependencia del Google Sheet heredado', tag: 'changed' }
        ]
    },
    {
        version: '1.6.0',
        items: [
            { text: 'Editor de capas: los campos de GeoServer (workspace, capa, estilo) se eligen desde listas dinámicas en lugar de escribirse a mano', tag: 'changed' },
            { text: 'Edición masiva de tags desde el editor con pegado directo de Excel (hasta 500 capas por envío)', tag: 'added' },
            { text: 'Límites de tasa en el panel de administración para proteger el servicio ante ráfagas de peticiones', tag: 'added' }
        ]
    },
    {
        version: '1.5.1',
        items: [
            { text: 'Editoras ahora pueden guardar cambios en capas como borradores que un administrador revisa antes de publicar', tag: 'added' }
        ]
    },
    {
        version: '1.5.0',
        items: [
            { text: 'Seguridad reforzada en configuración de numeralia: las estadísticas ahora se configuran con operaciones predefinidas (contar, sumar, promedio...) en lugar de escribir consultas', tag: 'changed' },
            { text: 'Actualización más estable: cuando un administrador edita varias capas seguidas, el sistema agrupa los refrescos para no saturar el servidor', tag: 'perf' }
        ]
    },
    {
        version: '1.4.8',
        items: [
            { text: 'Corregido: la búsqueda ahora indexa correctamente las capas y responde con resultados', tag: 'fixed' }
        ]
    },
    {
        version: '1.4.7',
        items: [
            { text: 'Corregido: la búsqueda de capas no encontraba resultados tras la migración al backend', tag: 'fixed' }
        ]
    },
    {
        version: '1.4.6',
        items: [
            { text: 'Corregido: la información al hacer click sobre una capa (InfoBox) y las descargas vectoriales no funcionaban por una desconexión interna', tag: 'fixed' }
        ]
    },
    {
        version: '1.4.5',
        items: [
            { text: 'Corregido: algunas capas no se dibujaban en el mapa porque la dirección del servicio WMS no se construía correctamente', tag: 'fixed' }
        ]
    },
    {
        version: '1.4.4',
        items: [
            { text: 'Documentación completa del sistema de capas (docs/layers.md)', tag: 'added' },
            { text: 'Script idempotente de bootstrap para configurar el esquema de capas en DataEngine', tag: 'added' }
        ]
    },
    {
        version: '1.4.3',
        items: [
            { text: 'Refactor total del sistema de capas: el frontend ya no contiene definiciones hardcodeadas, toda la información se obtiene del backend en tiempo real', tag: 'changed' },
            { text: 'Nuevo hook `useLayers` como única fuente del árbol de capas; 20 componentes migrados', tag: 'changed' }
        ]
    },
    {
        version: '1.4.2',
        items: [
            { text: 'Metadata de capas (descripción, fuentes, metodología, numeralia) migrada a tabla editable desde mariachi', tag: 'added' },
            { text: 'Numeralia dinámica: los valores se calculan con queries SQL configurables y se actualizan automáticamente cada día', tag: 'added' },
            { text: 'Editor de metadata en panel de administrador', tag: 'added' }
        ]
    },
    {
        version: '1.4.1',
        items: [
            { text: 'Mejora de rendimiento: el árbol de capas ahora se sirve desde una caché materializada, cargando en menos de 5ms', tag: 'perf' },
            { text: 'Los procesos de actualización diaria (periodicidad, árbol de capas, numeralia) se centralizaron en DataEngine', tag: 'changed' }
        ]
    },
    {
        version: '1.4.0',
        items: [
            { text: 'Sistema de capas dinámico: admin puede agregar, editar y quitar capas sin tocar código desde el panel de administración', tag: 'added' },
            { text: 'Editor visual de capas con árbol jerárquico, búsqueda y formularios por sección', tag: 'added' },
            { text: 'Flujo de revisión: editoras crean borradores, administradores aprueban y publican', tag: 'added' },
            { text: 'Introspección de GeoServer desde el editor: selección visual de workspace, capa, campos y estilos disponibles', tag: 'added' },
            { text: 'Búsqueda de capas desde el servidor con caché ETag para respuestas instantáneas cuando el contenido no ha cambiado', tag: 'perf' }
        ]
    },
    {
        version: '1.3.0',
        items: [
            { text: 'Carga inicial del sitio significativamente más rápida gracias a la separación del código en paquetes independientes y optimización de imágenes', tag: 'perf' },
            { text: 'El spinner de carga solo se descarga cuando realmente se necesita, reduciendo el peso inicial de la página', tag: 'perf' },
            { text: 'Las animaciones de fechas en las capas se detienen automáticamente al ocultar la capa para evitar consumo innecesario', tag: 'perf' },
            { text: 'Mejor accesibilidad: todos los botones y controles clickeables ahora responden a navegación con teclado (Enter/Espacio) y lectores de pantalla', tag: 'added' },
            { text: 'Sistema visual para destacar características nuevas: un punto naranja aparece sobre las funciones recién agregadas y desaparece al usarlas', tag: 'added' },
            { text: 'En las capas del Bosque de La Primavera el mapa se encuadra automáticamente al área real de la capa, sin zoom hardcodeado', tag: 'added' },
            { text: 'Al eliminar tarjetas en móvil deslizando, la animación es más fluida: las tarjetas colapsan suavemente en lugar de saltar', tag: 'changed' },
            { text: 'Al eliminar una tarjeta en móvil ya no se mueven ni desaparecen otras tarjetas por error', tag: 'fixed' },
            { text: 'En móvil, ahora puedes hacer mediciones y clicks en el mapa tocando entre los paneles laterales (zonas vacías del panel dejan pasar la interacción)', tag: 'fixed' },
            { text: 'Nueva barra de scroll vertical personalizada en toda la aplicación, más sutil', tag: 'changed' },
            { text: 'Actualización de dependencias clave: React 19.2.5, OpenLayers 10.9, Tailwind 4.2.4 y otras mejoras internas', tag: 'changed' }
        ]
    },
    {
        version: '1.2.0',
        items: [
            { text: 'Animación de periodicidad para todas las capas con fechas (antes solo raster). Los años o meses pueden ciclar automáticamente desde el modal de detalle', tag: 'added' },
            { text: 'Controles de animación junto a "Periodicidad:" en el modal: velocidad (0.25s a 3s), dirección (→/←), play/pausa y eliminar filtro de fecha', tag: 'added' },
            { text: 'El modal detecta si estás viendo años o meses y al dar play inicia la animación en el modo correcto', tag: 'added' },
            { text: 'Etiqueta compacta de fecha en el panel de capas activas con formatos "2024", "JUN 2024", "3 MESES 2024". Al hacer clic se inicia la animación si es posible, si no abre el detalle', tag: 'added' },
            { text: 'Durante la animación, el año o mes actual se resalta en naranja institucional y el carrusel hace scroll para mantenerlo visible', tag: 'added' },
            { text: 'Las flechas del carrusel de años solo aparecen cuando realmente se puede scrollear en esa dirección', tag: 'changed' },
            { text: 'En polígonos, al regresar a "todos los años" el año seleccionado permanece destacado', tag: 'fixed' },
            { text: 'El botón de detalle de capa permanece visible durante la animación (antes desaparecía por el indicador de carga)', tag: 'fixed' },
            { text: 'Al tocar el logo del IIEG se abre automaticamente la tarjeta de informacion centrada sobre el marcador', tag: 'added' },
            { text: 'En celulares el panel lateral se colapsa al tocar el logo del IIEG para ver mejor el mapa', tag: 'changed' },
            { text: 'En celulares la tarjeta de informacion ahora aparece como panel inferior de pantalla completa, con indicadores cuando hay mas tarjetas arriba o abajo', tag: 'changed' },
            { text: 'Nueva barra de herramientas en la tarjeta de informacion movil con opcion de descargar multiples tarjetas y lista para crecer con mas acciones', tag: 'added' },
            { text: 'En celulares cada tarjeta tiene un header compacto (barra lateral morada) que se adapta al ancho del panel', tag: 'changed' },
            { text: 'En celulares puedes eliminar una tarjeta deslizandola horizontalmente', tag: 'added' },
            { text: 'Mensajes "sin informacion aqui" y "resumen de seleccion por area" ahora se ven igual de pulidos en celular con encabezado y tipografia adaptada', tag: 'changed' },
            { text: 'Al tocar una capa sugerida en la tarjeta vacia ahora se muestra su informacion en el punto clickeado', tag: 'fixed' },
            { text: 'Ahora puedes editar emojis y textos colocados en el mapa: toca uno para seleccionarlo y aparece una barra con controles para arrastrar, rotar, cambiar el tamaño y eliminar', tag: 'added' }
        ]
    },
    {
        version: '1.1.4',
        items: [
            { text: 'Aviso de licencia IIEG al descargar datos con link a la declaración oficial', tag: 'added' },
            { text: 'Información detallada de Áreas Naturales Protegidas al hacer click', tag: 'added' },
            { text: 'Proceso de despliegue optimizado', tag: 'perf' }
        ]
    },
    {
        version: '1.1.3',
        items: [
            { text: 'Capa "Áreas Naturales Protegidas" disponible en Recursos', tag: 'added' },
            { text: 'Catálogo completo de emojis con categorías en herramientas de medición', tag: 'added' },
            { text: 'Video explicativo en la página de inicio', tag: 'added' },
            { text: 'Vista previa mejorada al compartir enlaces (imagen y descripción)', tag: 'added' },
            { text: 'Centrar Jalisco se adapta correctamente a pantallas móviles', tag: 'fixed' },
            { text: 'El modal de novedades ya no se cierra al hacer scroll en móvil', tag: 'fixed' },
            { text: 'Licencia actualizada a Licencia IIEG 2026', tag: 'changed' }
        ]
    },
    {
        version: '1.1.2',
        items: [
            { text: 'Descripción del proyecto actualizada', tag: 'changed' }
        ]
    },
    {
        version: '1.1.1',
        items: [
            { text: 'Información del IIEG mejorada con tecnologías como etiquetas', tag: 'changed' }
        ]
    },
    {
        version: '1.1.0',
        items: [
            { text: 'Zoom automático al activar capas específicas', tag: 'added' },
            { text: 'Marcadores interactivos con información al hacer click', tag: 'added' },
            { text: 'Botón para centrar la vista en Jalisco desde los controles del mapa', tag: 'added' },
            { text: 'Capas con rango de visibilidad por nivel de zoom', tag: 'added' },
            { text: 'Color naranja en el marcador de ubicación', tag: 'changed' }
        ]
    },
    {
        version: '1.0.10',
        items: [
            { text: 'Capa "Carencia por calidad y espacios de la vivienda" en Desarrollo Social', tag: 'added' }
        ]
    },
    {
        version: '1.0.9',
        items: [
            { text: 'Formato de fechas y folios corregido en la información de capas', tag: 'fixed' },
            { text: 'Dirección abre Google Maps y teléfono abre marcador desde la información de capas', tag: 'changed' }
        ]
    },
    {
        version: '1.0.8',
        items: [
            { text: 'Descargas de capas grandes ya no fallan por tiempo de espera', tag: 'fixed' },
            { text: 'Primera descarga más rápida al abrir la plataforma', tag: 'perf' }
        ]
    },
    {
        version: '1.0.6',
        items: [
            { text: 'Descarga directa de capas raster en formato GeoTIFF con metadatos', tag: 'added' }
        ]
    },
    {
        version: '1.0.5',
        items: [
            { text: 'Animación mensual en capas de precipitación y temperatura', tag: 'added' },
            { text: 'Estilos dinámicos por mes en capas de clima', tag: 'added' }
        ]
    },
    {
        version: '1.0.4',
        items: [
            { text: 'La capa seleccionada se mantiene al compartir o recargar el enlace', tag: 'added' },
            { text: 'Filtros de fecha se aplican correctamente al abrir un enlace compartido', tag: 'fixed' }
        ]
    },
    {
        version: '1.0.3',
        items: [
            { text: 'El orden de capas activas se mantiene al recargar la página', tag: 'fixed' }
        ]
    },
    {
        version: '1.0.2',
        items: [
            { text: 'Flechas de navegación solo aparecen cuando hay contenido desbordado', tag: 'fixed' }
        ]
    },
    {
        version: '1.0.1',
        items: [
            { text: 'URLs de metadatos de capas corregidas', tag: 'fixed' }
        ]
    },
    {
        version: '1.0.0',
        items: [
            { text: 'Descarga de capas en múltiples formatos (GeoPackage, Shapefile, CSV)', tag: 'added' },
            { text: 'Selector de fecha con navegación por año y mes', tag: 'added' },
            { text: 'Exportación de mapa con escala, leyenda, norte y coordenadas', tag: 'added' },
            { text: 'Animación temporal en capas raster (precipitación, temperatura)', tag: 'added' },
            { text: 'Selección de features por polígono dibujado', tag: 'added' },
            { text: 'Compartir estado del mapa vía URL', tag: 'added' },
            { text: 'Selector de calidad de exportación de mapa', tag: 'added' },
            { text: 'Panel de simbología con auto-expansión al seleccionar capa', tag: 'added' },
            { text: 'Modo móvil del panel lateral', tag: 'added' },
            { text: 'Herramientas de medición de línea y polígono', tag: 'added' }
        ]
    }
];

const API_URL = `${import.meta.env.VITE_BACKEND_API_HOST || '/api/'}release-notes`;

export const fetchReleaseNotes = async () => {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(res.status);
        return await res.json();
    } catch {
        return FALLBACK_NOTES;
    }
};

export const releaseNotes = FALLBACK_NOTES;
