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

No usar `POST /epics/{id}/related_userstories` (devuelve 400). Usar PATCH sobre la historia:

```python
us = api('GET', '/userstories/<US_ID>')
api('PATCH', '/userstories/<US_ID>', {'epic': <EPIC_ID>, 'version': us['version']})
```

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
us = api('PATCH', f'/userstories/{us["id"]}', {'epic': epic_id, 'version': us['version']})

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

### Títulos de tareas: sin prefijo de commit

Las tareas se leen en Taiga por personas no técnicas (PMs, stakeholders). Los títulos deben usar la **descripción del commit** como subject, sin el prefijo `tipo(scope):`. El prefijo y el hash del commit van en la descripción de la tarea.

- ❌ `feat(maps): exponer evento activo en MapsContext`
- ✅ `Exponer evento activo en MapsContext`

Aplica a tareas nuevas y a renombrado de tareas existentes que estén asignadas al usuario actual. **No renombrar tareas asignadas a otros**.

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

### Status cerrado para trabajo ya mergeado

Cuando creas items en Taiga para trabajo que **ya está mergeado** en `develop`/`production`, marcarlos al status con `is_closed=true` para que no se cuelen al sprint planning:

```python
us_statuses = api('GET', f'/userstory-statuses?project={PROJECT_ID}')
task_statuses = api('GET', f'/task-statuses?project={PROJECT_ID}')
US_DONE = next(s['id'] for s in us_statuses if s.get('is_closed'))
TASK_DONE = next(s['id'] for s in task_statuses if s.get('is_closed'))
```

Aplicar el `status` cerrado en un PATCH separado (post-creación) o en el mismo POST si la API lo permite.

### Helpers idempotentes `ensure_us` / `ensure_task`

Re-ejecutar un script de hidratación no debe duplicar items. Buscar por subject exacto y aplicar `PATCH` si existe, `POST` si no:

```python
def ensure_us(subject, description, epic_id, status_id):
    existing = api('GET', f'/userstories?project={PROJECT_ID}')
    found = next((u for u in existing if u['subject'] == subject), None)
    if found:
        full = api('GET', f"/userstories/{found['id']}")
        return api('PATCH', f"/userstories/{found['id']}", {
            'description': description,
            'epic': epic_id,
            'status': status_id,
            'version': full['version'],
        })
    us = api('POST', '/userstories', {
        'project': PROJECT_ID, 'subject': subject,
        'description': description,
    })
    full = api('GET', f"/userstories/{us['id']}")
    return api('PATCH', f"/userstories/{us['id']}", {
        'epic': epic_id, 'status': status_id, 'version': full['version'],
    })
```

Misma estructura para `ensure_task(us_id, subject, description, status_id)`. La regla de §Asignación por default aplica dentro del helper.

### Hash de commit en descripción

Última línea de la descripción de toda tarea: `Commit \`<hash-corto>\`.` o `Commits: \`<hash1>\`, \`<hash2>\`.` cuando aplique. Permite saltar de Taiga al repo sin abrir GitHub:

```
- ...bullet técnico...
- ...otro bullet...

Commit `a776c28`.
```

## Notas generales

- El SSL del servidor usa una CA local. Usar `-sk` en curl (skip verify) en entornos de desarrollo.
- Los tokens JWT expiran rápido; regenerar al inicio de cada script.
- El campo `version` en wiki es requerido para evitar sobreescrituras concurrentes.
- IDs de wiki de MapaLab relevantes: `home=1`, `roadmap=14`, `stack-tecnologicos=12`, `metricas=15`.
