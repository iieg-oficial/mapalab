# Widget MapaLab — Pendientes post-auditoría

Documento para retomar después de que cerremos el ciclo actual de auditoría.
Fecha de captura: 2026-05-13.

Estos pendientes salieron de la revisión de auditoría sobre el widget embebible.
Lo ya implementado (fallback, frame-ancestors defense-in-depth, auditoría de accesos,
Core Web Vitals, telemetría, lenguaje no técnico, etc.) está deployado en producción
local; vive en MapaLab (visor + endpoints `/embed`) y Mariachi (panel admin + llaves
+ tabla de auditoría).

---

## Tier A — Rápidos (1 día)

### A1 · Documento de gobernanza de datos del widget

- Markdown único con los 5 puntos de gobernanza formalmente resueltos:
  clasificación, licenciamiento, linaje, calidad/SLA, ciclo de vida.
- Acompaña la entrega de cada llave a las instituciones (referencia oficial).
- Ubicación sugerida: `mapalab/docs/gobernanza-widget.md`.
- Esfuerzo estimado: 30 min.

### A2 · Contrato de embebido versionado

- Markdown público con atributos del Web Component, eventos, errores, ejemplos
  y semver (vincularlo a `widget/package.json`).
- Reemplaza al `widget.md` actual con una versión formal "v1.0.0".
- Política de versionado: breaking changes → mayor; nuevos atributos → menor;
  fixes → patch. Anunciar en CHANGELOG.
- Ubicación sugerida: `mapalab/widget/CONTRACT.md` + endpoint público que lo sirva.
- Esfuerzo estimado: 30 min.

### A3 · Clasificación de capas (pública / reservada / confidencial)

- Campo `clasificacion` en metadata de capas (catálogo de MapaLab).
- Badge visual en `LayerTreeSelect` del admin (color por nivel).
- En `embed.py`, rechazar capas reservadas/confidenciales si la llave no tiene
  permiso explícito (campo nuevo `clasificaciones_permitidas` en `mapalab_api_keys`).
- Llenar la columna `clasificacion` de `mapalab_api_keys_accesos` (ya reservada).
- Telemetría: NO incluir slug de capa reservada en payload claro (hashear).
- Esfuerzo estimado: 1 h.

### A4 · SLA visible en el visor embebido

- Campos `sla_actualizacion` (mensual/trimestral/eventual) y
  `ultima_actualizacion` por capa.
- Etiqueta "Datos al corte de [fecha]" en el footer del visor embebido cuando
  haya una sola capa, o tooltip por capa cuando haya varias.
- Aviso visual cuando una capa está fuera de SLA (stale > X días).
- Llenar columna `sla_estado` de `mapalab_api_keys_accesos` (ya reservada).
- Esfuerzo estimado: 1 h.

---

## Tier B — Modelo + UI nueva (esta semana)

### B1 · Linaje hasta el origen

- Tabla nueva `mapalab_layer_lineage` con:
  - `layer_ref` (workspace:layer)
  - `dependencia_origen` (texto)
  - `fuente_url` (link al portal de la dependencia)
  - `etl_responsable` (correo / equipo)
  - `fecha_corte` (date)
  - `version_dataset` (texto, opcional)
- Endpoint público `/embed/layer-info?layer=workspace:capa` que devuelva el
  linaje (consultable también desde el visor full).
- Botón "Información de la capa" en el visor embebido que abra un modal con
  el linaje.
- Poblar columna `linaje_ref` de `mapalab_api_keys_accesos` con la versión usada.
- Esfuerzo estimado: 2-3 h.

### B2 · Términos y Condiciones versionados

- Tabla `mapalab_terminos_versiones` con `(id, version, contenido_md,
  publicada_en, vigente_desde)`.
- En `mapalab_api_keys` agregar `terminos_version_id`, `terminos_aceptados_en`,
  `terminos_aceptados_por_user_id`.
- Al crear o rotar una llave, modal en admin que muestra los T&C de la versión
  vigente y pide aceptación explícita (no es checkbox al guardar — paso aparte).
- Endpoint `GET /mapalab/terminos/{version}` que devuelva el MD.
- Botón en el detalle de la llave: "Descargar T&C aceptados (PDF)".
- Esfuerzo estimado: 2-3 h.

---

## Tier C — Requiere coordinación con otras áreas

### C1 · Backfills y notificación de cambios estructurales a instituciones

- **Técnico (1 día):** sistema de mailer + plantillas + tabla
  `mapalab_layer_changes` que registra cuando una capa cambia estructura
  (columnas nuevas, slug renombrado, dataset rebackfilled).
- **Bloqueado por:**
  - SMTP saliente productivo (¿usar `mailer` ya existente del IIEG?).
  - Plantillas aprobadas por área de comunicación.
  - Acuerdo institucional sobre "qué cuenta como cambio que merece aviso".

### C2 · Redacción real de los T&C

- El esqueleto técnico (B2) es independiente del contenido.
- **Bloqueado por:** área jurídica del IIEG. Sin ese contenido, los T&C
  versionados quedan con placeholder.

### C3 · Definir SLAs reales por capa con las dependencias productoras

- A4 surface "Datos al corte de X". Pero el "X" real lo debe definir la
  dependencia que provee cada capa.
- **Bloqueado por:** reuniones con cada dependencia productora.
- Mientras tanto: usar el catálogo de MapaLab existente y poner SLA
  conservador (último corte conocido + 90 días) como fallback.

### C4 · Mapeo en Taiga

- Crear las 4 épicas sugeridas por el auditor:
  - Widget Core
  - Integración MapaLab (no SIEEJ — corregir el malentendido del auditor)
  - Gobernanza
  - Seguridad / DevOps
- Trasladar los items de este documento a tarjetas de cada épica.
- **Bloqueado por:** acceso a Taiga (el usuario no quiere que lo haga yo).

---

## Orden recomendado para retomar

1. **A1 + A2** — documentos formales (cierran 2 puntos de "Próximos pasos
   sugeridos" del auditor sin tocar código).
2. **A3 + A4** — cambios chicos en backend + UI; cierran los puntos 1 y 4
   de gobernanza.
3. **B1** — linaje. Cierra el punto 3 de gobernanza.
4. **B2** — T&C versionados (esqueleto). Cierra el punto 2 de gobernanza
   parcialmente; espera contenido jurídico para cerrarse completo.
5. **C1** — notificaciones automáticas. Cierra el punto 5 de gobernanza.
6. **C2, C3, C4** — requieren coordinación con otras áreas (jurídico,
   dependencias productoras, gestión de proyecto).

---

## Estado de los puntos de auditoría

| Punto | Categoría | Estado actual |
|---|---|---|
| Clasificación de la información | Gobernanza | Pendiente Tier A3 |
| Licenciamiento y T&C | Gobernanza | Pendiente Tier B2 + C2 |
| Linaje | Gobernanza | Pendiente Tier B1 |
| Calidad / SLA | Gobernanza | Pendiente Tier A4 + C3 |
| Ciclo de vida del dato | Gobernanza | Parcial (retención lista, notificaciones C1) |
| Observabilidad / Core Web Vitals | DevOps | ✅ Implementado |
| Fallback / degradación | DevOps | ✅ Implementado |
| Frame-ancestors / clickjacking | DevOps | ✅ Implementado (defense-in-depth) |
| Auditoría de accesos | DevOps | ✅ Implementado (90 días retención) |
| Contrato de embebido | Próximos | Pendiente Tier A2 |
| Documento de gobernanza | Próximos | Pendiente Tier A1 |
| Mapeo en Taiga | Próximos | Pendiente Tier C4 |

---

## Notas para retomar

- El malentendido del auditor sobre "SIEEJ" debe corregirse en cualquier
  reentrega: el widget vive en **MapaLab** (visor + `/embed`) y se administra
  desde **Mariachi** (panel + llaves + auditoría). SIEEJ es solo un sitio
  de demo donde está embebido.
- Las columnas reservadas en `mapalab_api_keys_accesos` (`clasificacion`,
  `sla_estado`, `linaje_ref`) están listas para llenarse — la auditoría ya
  acepta esos campos pero todavía no se popula.
- Los modelos de Tier B requieren migración Alembic + actualizar
  `app/models/__init__.py`.
- La llave de pruebas activa hoy es `mk_pub_kRrt…` para
  `https://<host-staging>` (institución "Pruebas SIEEJ"). Renombrarla a
  "Pruebas locales" cuando se retomen estos pendientes.
