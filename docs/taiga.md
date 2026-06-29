# Taiga API — Referencia de uso en MapaLab

Instancia self-hosted del IIEG: `https://proyectosiieg.jalisco.gob.mx`

Las credenciales viven en `.env.development` bajo el bloque `# Taiga`.

---

## Autenticación

```bash
TOKEN=$(curl -sk -X POST "$TAIGA_URL/api/v1/auth" \
  -H "Content-Type: application/json" \
  -d "{\"type\": \"normal\", \"username\": \"$TAIGA_USERNAME\", \"password\": \"$TAIGA_PASSWORD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['auth_token'])")
```

El token es JWT de corta duración. Regenerarlo al inicio de cada sesión de scripting.

---

## Patrón estándar HTTP

Todos los scripts que tocan la API deben usar este helper en Python puro (no shell, no `requests`, no axios). Resuelve los principales pitfalls: control de SSL con CA local, JSON con caracteres de control en descripciones, parsing seguro.

```python
import urllib.request, json, ssl

BASE = 'https://proyectosiieg.jalisco.gob.mx/api/v1'
TOKEN = '<auth_token>'  # ver §Autenticación
HEADERS = {'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE  # CA local, ver §Notas generales

def api(method, path, body=None):
    req = urllib.request.Request(
        f'{BASE}{path}', headers=HEADERS, method=method,
        data=json.dumps(body).encode() if body else None,
    )
    with urllib.request.urlopen(req, context=ctx) as r:
        return json.loads(r.read())
```

Por qué Python puro y no shell:

- Las `description` de tareas/historias contienen saltos de línea, tabs y otros caracteres de control. Si guardas la respuesta en una variable shell (`VAR=$(curl ...)`), el JSON queda corrupto y `json.load` revienta con `Invalid control character`.
- Punto único de cambio si la API requiere headers nuevos (CSRF, paginación, tipos de contenido).
- Manejo limpio de `urllib.error.HTTPError` con cuerpo del error: `e.read().decode()`.

Todos los ejemplos posteriores (`api(...)`) asumen este helper inicializado.

---

## Proyectos

### Listar proyectos del usuario

```bash
curl -sk "$TAIGA_URL/api/v1/projects?member=$TAIGA_USER_ID&order_by=name" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
for p in json.load(sys.stdin):
    print(f'ID: {p[\"id\"]} | {p[\"name\"]} | slug: {p[\"slug\"]}')
"
```

| ID | Nombre | Slug |
|----|--------|------|
| 1 | MapaLab | `mapalab` |
| 2 | Nuevo sitio del IIEG | `nuevo-sitio-del-iieg` |
| 3 | SIIEJ | `siiej` |
| 4 | Tableros municipales | `tableros-municipales` |
| 16 | Sitio Web Actual IIEG | `sitio-web-actual-iieg` |

---

## Historias de usuario

### Listar asignadas a un usuario en un proyecto

```bash
curl -sk "$TAIGA_URL/api/v1/userstories?project=$TAIGA_PROJECT_ID&assigned_to=$TAIGA_USER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
for u in json.load(sys.stdin):
    status = u.get('status_extra_info', {}).get('name', '?')
    sprint = u.get('milestone_name') or 'Sin sprint'
    print(f'#{u[\"ref\"]} [{status}] {u[\"subject\"]} | {sprint}')
"
```

### Crear historia de usuario

```bash
curl -sk -X POST "$TAIGA_URL/api/v1/userstories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"project\": $TAIGA_PROJECT_ID,
    \"subject\": \"Título de la historia\",
    \"description\": \"Descripción detallada\",
    \"assigned_to\": $TAIGA_USER_ID
  }"
```

---

## Tareas

### Listar asignadas a un usuario en un proyecto

```bash
curl -sk "$TAIGA_URL/api/v1/tasks?project=$TAIGA_PROJECT_ID&assigned_to=$TAIGA_USER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
for t in json.load(sys.stdin):
    status = t.get('status_extra_info', {}).get('name', '?')
    print(f'#{t[\"ref\"]} [{status}] {t[\"subject\"]}')
"
```

### Crear tarea (asociada a una historia de usuario)

```bash
curl -sk -X POST "$TAIGA_URL/api/v1/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"project\": $TAIGA_PROJECT_ID,
    \"user_story\": <US_ID>,
    \"subject\": \"Título de la tarea\",
    \"assigned_to\": $TAIGA_USER_ID
  }"
```

---

## Issues

### Listar asignados a un usuario en un proyecto

```bash
curl -sk "$TAIGA_URL/api/v1/issues?project=$TAIGA_PROJECT_ID&assigned_to=$TAIGA_USER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
for i in json.load(sys.stdin):
    status = i.get('status_extra_info', {}).get('name', '?')
    itype = i.get('type_extra_info', {}).get('name', '?')
    print(f'#{i[\"ref\"]} [{itype}] [{status}] {i[\"subject\"]}')
"
```

### Crear issue

```bash
curl -sk -X POST "$TAIGA_URL/api/v1/issues" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"project\": $TAIGA_PROJECT_ID,
    \"subject\": \"Título del issue\",
    \"description\": \"Descripción\",
    \"assigned_to\": $TAIGA_USER_ID
  }"
```

---

## Wiki

### Listar páginas

```bash
curl -sk "$TAIGA_URL/api/v1/wiki?project=$TAIGA_PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
for p in json.load(sys.stdin):
    print(f'ID: {p[\"id\"]} | slug: {p[\"slug\"]}')
"
```

### Leer página por ID

```bash
curl -sk "$TAIGA_URL/api/v1/wiki/<WIKI_ID>" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
p = json.load(sys.stdin)
print('Versión:', p['version'])
print(p['content'])
"
```

### Actualizar página (PATCH)

El campo `version` es obligatorio para control de concurrencia optimista.
Siempre leer la versión actual antes de actualizar.

```bash
python3 -c "
import json
with open('nuevo_contenido.md') as f:
    content = f.read()
with open('/tmp/payload.json', 'w') as f:
    json.dump({'content': content, 'version': <VERSION_ACTUAL>}, f)
"

curl -sk -X PATCH "$TAIGA_URL/api/v1/wiki/<WIKI_ID>" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @/tmp/payload.json \
  | python3 -c "
import sys,json
r = json.load(sys.stdin)
print('Nueva versión:', r['version'])
"
```

### Crear página nueva

```bash
curl -sk -X POST "$TAIGA_URL/api/v1/wiki" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"project\": $TAIGA_PROJECT_ID,
    \"slug\": \"nombre-de-la-pagina\",
    \"content\": \"# Título\\n\\nContenido en markdown.\"
  }"
```

---

## Épicas

### Crear épica

```bash
curl -sk -X POST "$TAIGA_URL/api/v1/epics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"project\": $TAIGA_PROJECT_ID,
    \"subject\": \"Mapalab 1.x.x\",
    \"description\": \"Descripción en markdown.\",
    \"assigned_to\": $TAIGA_USER_ID
  }"
```

### Listar épicas del proyecto

```bash
curl -sk "$TAIGA_URL/api/v1/epics?project=$TAIGA_PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
for e in json.load(sys.stdin):
    print(f'ID: {e[\"id\"]} | #{e[\"ref\"]} {e[\"subject\"]}')
"
```

### Actualizar descripción de una épica (PATCH)

Siempre leer la versión actual antes de actualizar.

```python
import urllib.request, json, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE = 'https://proyectosiieg.jalisco.gob.mx/api/v1'
HEADERS = {'Authorization': 'Bearer <TOKEN>', 'Content-Type': 'application/json'}

def api(method, path, body=None):
    req = urllib.request.Request(
        f'{BASE}{path}', headers=HEADERS, method=method,
        data=json.dumps(body).encode() if body else None
    )
    with urllib.request.urlopen(req, context=ctx) as r:
        return json.loads(r.read())

epic = api('GET', '/epics/<ID>')
api('PATCH', '/epics/<ID>', {'description': '# Nueva descripción', 'version': epic['version']})
```

### Vincular historia de usuario a una épica

Esto es lo que llena la pestaña **User stories** de la épica en la UI. Sin este paso, aunque la descripción de la épica mencione las historias y aunque las historias listen su épica en su descripción, **la épica aparecerá visualmente sin historias hijas**.

Endpoint: `POST /epics/{epic_id}/related_userstories` con body `{epic, user_story}`. Ambos campos son requeridos (con solo `user_story` devuelve 400 "epic: This field is required.").

```python
api('POST', f'/epics/{epic_id}/related_userstories',
    {'epic': epic_id, 'user_story': us_id})
```

Idempotencia: si la relación ya existe, devuelve `400` con `"__all__": ["Related user story with this User story and Epic already exists."]`. Capturar y continuar.

**Pitfall del PATCH con `epic:`**: hacer `PATCH /userstories/{id}` con `{'epic': epic_id, ...}` **no falla con error pero tampoco crea el vínculo**. El campo silenciosamente se descarta. Idem `{'epics': [epic_id]}`. Usar siempre el endpoint `related_userstories`.

### Verificar vínculos de una épica

```python
rel = api('GET', f'/epics/{epic_id}/related_userstories')
print(f'{len(rel)} historias vinculadas')
```

Nota: el campo `user_story_extra_info` de la respuesta puede venir vacío (`ref=None, subject=None`); la relación sí está creada, es un detalle de hidratación del endpoint. Para ver los refs, hacer GET individual a cada `user_story` id en la respuesta.

**Forma de la respuesta de `related_userstories`**: cada item es `{'epic': <epic_id>, 'user_story': <us_id>, 'order': <int>}`. **No trae un `id` de relación propio** — para borrar el vínculo se usa el `user_story` id directamente (ver abajo).

### Desvincular / mover una historia entre épicas

Desvincular: `DELETE /epics/{epic_id}/related_userstories/{user_story_id}` (el path usa el **id de la historia**, no un id de relación).

```python
api('DELETE', f'/epics/{epic_id}/related_userstories/{us_id}')
```

Para **mover** una historia de una épica a otra: primero `POST related_userstories` en la épica destino (idempotente), luego `DELETE` en la origen. El orden importa para no dejar la historia huérfana si algo falla a medias.

Borrar una épica con `DELETE /epics/{id}` **no borra sus historias**: solo se pierde el vínculo. Útil al consolidar épicas (mover sus US a otra y luego borrar la vacía).

---

## Flujo recomendado: Épica → Historia → Tarea

```
Épica (milestone/versión)
└── Historia de usuario (feature independiente, va a sprint)
    └── Tarea (subtarea técnica)
```

- **Épica**: contenedor del milestone o versión (ej. `Mapalab 1.4.0`). Tiene descripción rica con arquitectura y referencias.
- **Historia**: una funcionalidad concreta dentro de la épica (ej. *"Endpoints de búsqueda en datos de capas"*). Se estima y entra a un sprint.
- **Tarea**: paso técnico de la historia (ej. *"Implementar GET /mapalab/layers/search"*).

### Crear los tres a la vez (Python)

```python
# 1. Crear o localizar la épica
epic = api('POST', '/epics', {
    'project': TAIGA_PROJECT_ID,
    'subject': 'Mapalab 1.4.0',
    'description': '...'
})
epic_id = epic['id']

# 2. Crear historia y vincularla a la épica
us = api('POST', '/userstories', {
    'project': TAIGA_PROJECT_ID,
    'subject': 'Endpoints de búsqueda en datos de capas',
    'assigned_to': TAIGA_USER_ID
})
api('POST', f'/epics/{epic_id}/related_userstories',
    {'epic': epic_id, 'user_story': us['id']})

# 3. Crear tarea vinculada a la historia
api('POST', '/tasks', {
    'project': TAIGA_PROJECT_ID,
    'user_story': us['id'],
    'subject': 'Implementar GET /mapalab/layers/search',
    'assigned_to': TAIGA_USER_ID
})
```

### Actualizar los tres en cascada

```python
# Épica: actualizar descripción
epic = api('GET', f'/epics/{epic_id}')
api('PATCH', f'/epics/{epic_id}', {'description': nueva_desc, 'version': epic['version']})

# Historia: cambiar estado
us = api('GET', f'/userstories/{us_id}')
api('PATCH', f'/userstories/{us_id}', {'status': <STATUS_ID>, 'version': us['version']})

# Tarea: marcar como done
task = api('GET', f'/tasks/{task_id}')
api('PATCH', f'/tasks/{task_id}', {'status': <STATUS_ID>, 'version': task['version']})
```

Para obtener los IDs de estados disponibles:

```bash
curl -sk "$TAIGA_URL/api/v1/userstory-statuses?project=$TAIGA_PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; [print(f'{s[\"id\"]} {s[\"name\"]}') for s in json.load(sys.stdin)]"

curl -sk "$TAIGA_URL/api/v1/task-statuses?project=$TAIGA_PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; [print(f'{s[\"id\"]} {s[\"name\"]}') for s in json.load(sys.stdin)]"
```

---

## Pitfalls conocidos

### Paginación en listados de tareas

La API devuelve **30 resultados por página**. Un query sin `&page=N` solo trae la primera página. En un proyecto con historial largo (MapaLab tiene ~260 tareas) se pierden resultados. Siempre paginar:

```python
all_tasks = []
page = 1
while True:
    result = subprocess.run(
        ["curl", "-sk", f"{base}&page={page}", "-H", f"Authorization: Bearer {token}"],
        capture_output=True, text=True
    )
    data = json.loads(result.stdout)
    if not data or not isinstance(data, list):
        break
    all_tasks.extend(data)
    if len(data) < 30:
        break
    page += 1
```

### assigned_to_extra_info puede ser null aunque la tarea esté asignada

Algunas tareas tienen `assigned_to: <USER_ID>` correcto pero `assigned_to_extra_info: null`. Esto provoca dos problemas:

1. El filtro `?assigned_to=<ID>` **no las devuelve** en el listado.
2. Al parsear el nombre del asignado aparece "Sin asignar" aunque sí lo esté.

**Solución:** para auditar tareas asignadas a un usuario específico, obtener **todas las páginas** sin filtro y filtrar en Python por `assigned_to`:

```python
mis_tareas = [t for t in all_tasks if t.get('assigned_to') == TAIGA_USER_ID]
pendientes  = [t for t in mis_tareas if not t.get('status_extra_info', {}).get('is_closed', False)]
```

### Caracteres especiales en descripciones

No guardes respuestas JSON en variables de shell — usa siempre el helper Python `api()` documentado en §Patrón estándar HTTP. Las descripciones de tareas suelen tener saltos de línea/tabs que rompen el shell.

### Resolver ref → ID interno

El parámetro `?ref=N` en `/api/v1/tasks` no filtra correctamente. Usar el endpoint `resolver`:

```bash
curl -sk "$TAIGA_URL/api/v1/resolver?project=mapalab&task=<REF>" \
  -H "Authorization: Bearer $TOKEN"
# Devuelve: {"project": 1, "task": <ID_INTERNO>}
```

---

## Convenciones

### Asignación por default

Cuando crees o modifiques épicas, historias, tareas o issues:

- Si el item **no tiene `assigned_to`** (es `null` o no viene en el body), asignarlo a `$TAIGA_USER_ID` por default.
- Si ya tiene `assigned_to` (otro usuario), **no sobrescribir** — respetar la asignación existente.

Aplica al crear (POST) y al actualizar (PATCH). En PATCH, si la respuesta de `GET` previa muestra `assigned_to: null`, incluir `"assigned_to": <USER_ID>` en el cuerpo del PATCH antes de enviar.

```python
target = api('GET', f'/userstories/{us_id}')
patch = {'version': target['version'], ...resto_de_cambios}
if target.get('assigned_to') is None:
    patch['assigned_to'] = TAIGA_USER_ID
api('PATCH', f'/userstories/{us_id}', patch)
```

### Títulos: patrón homologado

Las tres jerarquías siguen un patrón fijo. Mantenerlo es lo que permite que el backlog se lea de un golpe y que cualquier ingest futuro sea visualmente coherente con los anteriores.

**Épica** — contenedor del rango de versiones, sin descripción inline:

- Patrón: `Mapalab X.Y.x`
- Ejemplos: `Mapalab 1.28.x`, `Mapalab 1.20.x`
- ❌ `Mapalab 1.20.0 — Auditoría de eventos: perf y telemetría` (sin descripción inline; eso va en la descripción de la épica, no en el subject)

**User Story** — un cambio coherente dentro de una versión específica:

- Patrón: `vX.Y.Z — <descripción funcional>`
- `v` en minúscula, em-dash (`—`) con espacios alrededor, descripción que empieza con sustantivo o sustantivada (no con verbo).
- Ejemplos: `v1.28.0 — Métricas HTTP estándar del backend para Prometheus`, `v1.28.2 — Lectura fresca del árbol de capas en el loop temporal`.
- ❌ `Mapalab 1.20.0 — Auditoría de eventos: perf, EventoContext, persistencia y telemetría` (sin `Mapalab` prefijo, sin dos puntos enlistando, no se mezclan nombres internos en el subject).
- ❌ `Implementar métricas HTTP` (un subject que empieza con verbo es de tarea, no de historia).

**Tarea** — un paso técnico concreto, sin prefijo de versión:

- Patrón: `<Verbo en infinitivo> <objeto técnico>`
- Sin prefijo de commit (`tipo(scope):`); el prefijo y el hash del commit van en la descripción.
- Ejemplos: `Integrar el instrumentador HTTP en el backend`, `Subir MAX_LOADING_RETRIES de 100 a 300`, `Cancelar los temporizadores del loop al desmontar el provider`.
- ❌ `feat(maps): exponer evento activo en MapsContext`
- ❌ `v1.28.5 — Crear validador interno` (las tareas no llevan prefijo de versión)

Aplica a items nuevos y a renombrado de items existentes que estén asignados al usuario actual. **No renombrar items asignados a otros**.

### `description` viene truncado en endpoints de listado

Los endpoints `/userstories`, `/tasks` y `/epics` devuelven `description` recortado o vacío en el listado. Para verificar si un item está hidratado, pedirlo individualmente:

```python
t = api('GET', f'/tasks/by_ref?project={PROJECT_ID}&ref={ref}')
hidratada = bool((t.get('description') or '').strip())
```

No filtrar por `descLen==0` desde el listado: vas a "hidratar" items que ya tienen contenido y a sobrescribir trabajo previo.

### Confirmar plan antes de operaciones bulk

Antes de POST/PATCH masivos (épica + N user stories + M tareas, o renombrado de varias tareas), imprimir el plan completo (subjects, descriptions, vínculos) y esperar aprobación del usuario. Sólo después ejecutar.

Una vez ejecutándose, el script debe ser idempotente: cada `ensure_*` busca por subject antes de crear (ver §Helpers idempotentes).

### Estructura jerárquica de hidratación

Para un release `vX.Y.Z`:

1. **Épica** `Mapalab X.Y.x` — resumen ejecutivo de la versión en markdown, con secciones por subversión y viñetas por feature.
2. **User Story** `vX.Y.Z — <feature>` — descripción técnica del bloque de cambios. Vincular a la épica via `PATCH /userstories/{id}` con campo `epic` (ver §Épicas).
3. **Tareas** — una por commit relevante; descripción con bullets concretas + hash del commit al final (ver §Hash de commit en descripción).

Cuando un release toca varios subsistemas (ej. comparador + eventos), una US por subsistema, no una US por release.

### Granularidad: una historia por fix/feature concreto

Las historias deben representar **un cambio coherente y verificable**, no agrupar cosas porque vivan en el mismo archivo. Si un release toca cinco bugs distintos del mismo hook, son cinco historias (cada una con su descripción de Objetivo / Contexto / Resultado), no una historia "Bugfixes del hook". Esto facilita revisión, estimación y trazabilidad a commits.

Regla práctica: si tienes que usar la palabra "y" en el subject de la historia, probablemente es más de una historia. Excepciones: ajustes finos sumamente pequeños del mismo parámetro (ej. dos constantes relacionadas) pueden ir juntos.

### Estructura de descripciones (Objetivo / Contexto / Resultado)

Toda **épica** e **historia** se hidrata con tres o cuatro secciones, en este orden:

```markdown
## Objetivo

Una a tres líneas que explican qué se busca lograr y a quién beneficia. Lenguaje
accesible: si la lee una persona de área no técnica, debe entender el qué y el porqué.

## Contexto

Por qué se hace el cambio: incidente, deuda técnica, requerimiento externo, falla
observada. Aquí sí se pueden mencionar archivos, funciones y nombres internos.

## Resultado

Estado final tras la entrega. Una a tres líneas.

## Coordinación  (opcional)

Dependencias con otros sistemas/repos, requisitos de versión mínima, variables de
entorno compartidas. Se omite si no aplica.
```

Las **tareas** llevan estructura más simple:

```markdown
## Cambios

- Bullet técnico 1 (archivo, función, número de línea cuando aporta).
- Bullet técnico 2.

Commit: `<hash-corto>`.
```

Lenguaje:

- **Épicas** y la primera sección (Objetivo) de las historias se redactan para servidor público común: evitar `hook`, `provider`, `context`, `closure`, `tile`, etc. cuando se puedan sustituir por una descripción funcional. Términos genuinos del dominio (`GeoServer`, `Prometheus`, `nginx`, `cache`) sí pueden quedarse.
- Sin emojis en subjects ni descripciones.

### Etiquetas por área técnica

Aplicar al campo `tags` (lista de strings) según el área principal del item. Las etiquetas son libres en este proyecto (no hay catálogo fijo); usar el set siguiente como convención:

- `backend` — cambios en `backend/app/**`.
- `frontend` — cambios en `frontend/src/**`.
- `infra` — `nginx`, `docker-compose`, `Makefile`, `scheduler`, deploy.
- `docs` — `docs/**`, `README.md`, comentarios estructurales.
- `tests` — cambios en suites de prueba (`backend/test/**`, `frontend/src/**/*.test.*`).

Las épicas pueden cargar varias etiquetas (`backend`, `frontend`, `infra`, `docs`). Las historias y tareas idealmente una o dos.

### Puntos: escala Fibonacci del proyecto

La escala configurada en el proyecto MapaLab (IDs reales en `GET /points?project=1`):

| Nombre | Valor | ID |
|--------|------:|---:|
| `1/2`  | 0.5   | 3  |
| `1`    | 1.0   | 4  |
| `2`    | 2.0   | 5  |
| `3`    | 3.0   | 6  |
| `5`    | 5.0   | 7  |
| `8`    | 8.0   | 8  |
| `10`   | 10.0  | 9  |
| `13`   | 13.0  | 10 |
| `20`   | 20.0  | 11 |
| `40`   | 40.0  | 12 |

Roles del proyecto (IDs reales en `GET /roles?project=1`): `1 UX`, `2 Design`, `3 Front`, `4 Back`, `5 Product Owner`, `6 Stakeholder`, `7 Gobernanza`, `8 Datos Abiertos`.

El campo `points` de una user story es un dict `{role_id_str: point_id}`. Asignar el punto al **rol principal** del trabajo. Ejemplo para una historia frontend de 5 puntos:

```python
api('PATCH', f'/userstories/{us_id}', {
    'points': {'3': 7},  # Rol Front (3) → punto "5" (id 7)
    'version': us_full['version'],
})
```

Las **tareas no llevan puntos individuales** (no aplica el campo). La suma de tareas puede ser menor o igual a la estimación de la historia: la historia se estima de manera integral, las tareas son desglose técnico.

Calibración mental (no es regla rígida):

- `1/2` — cambio de una sola constante o flag.
- `1` — refactor mecánico, rename, ajuste menor con tests intactos.
- `2` — fix de un solo bug acotado, con análisis breve.
- `3` — feature pequeña aislada, o fix con análisis profundo en un componente.
- `5` — integración nueva (librería + config + docs), o fix con cambios coordinados en varios archivos.
- `8` — feature mediana con efectos cross-cutting, o módulo nuevo con pruebas.
- `13` — auditoría a fondo (múltiples bugs latentes), refactor de un sistema completo.
- `20+` — un release entero o un cambio que cruza varios subsistemas; idealmente dividir.

### Fecha límite (`due_date`)

Aplica a **tareas, historias e issues**. **Las épicas NO soportan `due_date`** en esta instancia: el `PATCH` con `due_date` se acepta sin error pero el campo **no se persiste** (queda `null` al releer). No insistir; la entrega de una épica se rastrea por el estado de sus historias.

Las user stories tampoco llevan `due_date` en la convención del proyecto (su entrega se rastrea por el milestone y por el estado de sus tareas).

Formato: `YYYY-MM-DD`. Para trabajo retroactivo (tarea que se hidrata después de mergear), usar la fecha del día de hidratación: refleja cuándo se cerró el registro en Taiga, aunque el merge sea anterior.

```python
api('PATCH', f'/tasks/{task_id}', {
    'due_date': '2026-05-15',
    'version': task_full['version'],
})
```

### Status cerrado para trabajo ya mergeado

Cuando creas items en Taiga para trabajo que **ya está mergeado** en `develop`/`production`, marcarlos al status con `is_closed=true` para que no se cuelen al sprint planning:

```python
us_statuses = api('GET', f'/userstory-statuses?project={PROJECT_ID}')
task_statuses = api('GET', f'/task-statuses?project={PROJECT_ID}')
US_DONE = next(s['id'] for s in us_statuses if s.get('is_closed'))
TASK_DONE = next(s['id'] for s in task_statuses if s.get('is_closed'))
```

Aplicar el `status` cerrado en un PATCH separado (post-creación) o en el mismo POST si la API lo permite.

Valores observados en MapaLab (sujetos a cambio si se reconfigura el proyecto):

- Epic status `Done` → id `5`.
- User story status `Done` → id `5` (también existe `Archived` id `6`, también cerrado).
- Task status `Finalizada` → id `4` (es el único `is_closed=true` del flujo).

Aun cerrando el item, sí aplica la regla de §Fecha límite (`due_date`).

### Helpers idempotentes `ensure_us` / `ensure_task`

Re-ejecutar un script de hidratación no debe duplicar items. Buscar por subject exacto y aplicar `PATCH` si existe, `POST` si no:

```python
def link_us_to_epic(us_id, epic_id):
    """Idempotente. Si la relación ya existe, la API devuelve 400 y se ignora."""
    try:
        api('POST', f'/epics/{epic_id}/related_userstories',
            {'epic': epic_id, 'user_story': us_id})
    except urllib.error.HTTPError as e:
        if e.code == 400 and b'already exists' in e.read():
            return
        raise

def ensure_us(subject, description, epic_id, status_id):
    existing = api('GET', f'/userstories?project={PROJECT_ID}')
    found = next((u for u in existing if u['subject'] == subject), None)
    if found:
        full = api('GET', f"/userstories/{found['id']}")
        us = api('PATCH', f"/userstories/{found['id']}", {
            'description': description,
            'status': status_id,
            'version': full['version'],
        })
    else:
        us = api('POST', '/userstories', {
            'project': PROJECT_ID, 'subject': subject,
            'description': description,
        })
        full = api('GET', f"/userstories/{us['id']}")
        us = api('PATCH', f"/userstories/{us['id']}", {
            'status': status_id, 'version': full['version'],
        })
    link_us_to_epic(us['id'], epic_id)
    return us
```

Misma estructura para `ensure_task(us_id, subject, description, status_id)` (las tareas sí aceptan el campo `user_story` en POST o PATCH; no necesitan endpoint aparte). La regla de §Asignación por default aplica dentro del helper.

### Hash de commit en descripción

Última línea de la descripción de toda tarea: `Commit \`<hash-corto>\`.` o `Commits: \`<hash1>\`, \`<hash2>\`.` cuando aplique. Permite saltar de Taiga al repo sin abrir GitHub:

```
- ...bullet técnico...
- ...otro bullet...

Commit `a776c28`.
```

## Higiene del backlog

- **El "Backlog" de Taiga = user stories sin milestone.** Cerrar una historia (`is_closed`) **no la saca del backlog**; lo que la saca es asignarle un `milestone`. Para limpiar releases ya entregados que cuelgan del backlog, moverlos a un milestone (cerrado), no basta con cerrarlos.
- **Convención de milestones por periodo**: para trabajo retroactivo se usan milestones por trimestre (`2026-Q1`, `2026-Q2`, …) creados con `POST /milestones` (`project`, `name`, `estimated_start`, `estimated_finish` en `YYYY-MM-DD`). El `total_points`/`closed_points` del milestone se calcula solo de las historias que tiene asignadas.
- **Épicas de release por decena**: el histórico de versiones se agrupa en épicas `Mapalab 1.Nx` (una por decena: `1.0x`=v1.0–v1.9, `1.1x`=v1.10–v1.20, `1.2x`=v1.21–v1.29, … `1.7x`=v1.70–v1.79). Una historia por versión menor (`vX.Y.x — <desc>`), agrupando sus patches en bullets. La épica paraguas `#542` quedó solo con historias de otros involucrados (no versionadas).

## Puntos: cómo se ven y se suman

- **Las épicas NO muestran suma de puntos** en su tarjeta — su progreso se mide por número de historias. Los puntos solo se ven en el **milestone/sprint** y en el backlog. Si esperas un total de puntos en la épica, no aparece ahí.
- **`total_points` de una historia** = suma de los puntos de los roles **computables** (en MapaLab los 8 roles son `computable=True`). Si el `points` dict tiene todos los roles en `?` (point id `1`), `total_points` queda en `null`. Para que una historia "sume", asignar un punto real a su rol principal (p. ej. `{'3': 6}` = Front → "3").
- Al asignar puntos retroactivos a releases ya entregados, usar calibración baja (la mayoría 1–3); reservar 5 para los bloques genuinamente grandes.

## Notas generales

- El SSL del servidor usa una CA local. Usar `-sk` en curl (skip verify) en entornos de desarrollo.
- Los tokens JWT expiran rápido; regenerar al inicio de cada script.
- El campo `version` en wiki es requerido para evitar sobreescrituras concurrentes.
- IDs de wiki de MapaLab relevantes: `home=1`, `roadmap=14`, `stack-tecnologicos=12`, `metricas=15`.
