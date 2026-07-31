# Runbook — Sistema de capas

Procedimientos de recuperación para el stack de capas (DataEngine + mariachi + mapalab).

## Diagnóstico rápido

```bash
# 1. Estado de containers
docker ps --filter "name=dataengine-"
docker ps --filter "name=mariachi-"
docker ps --filter "name=mapalab-"

# 2. Endpoints vivos
curl -I http://localhost:8000/health                    # mapalab backend
curl -I http://localhost:8000/layers/tree               # esperado 200 con ETag

# 3. Cache materializada
docker exec -e PGPASSWORD="$PWD" dataengine-primary psql -U mariachi_layers -d iieg_gis -c "
SELECT id, layer_count, etag, updated_at FROM mapalab.layer_tree_cache;
"

# 4. Cron jobs (logs recientes)
cd /IIEG/dataengine && make logs   # elegir 'jobs' en el selector
```

---

## Escenario 1: `/layers/tree` devuelve error o vacío

### Síntoma
Frontend no carga capas, `LayersProvider` muestra pantalla de error.

### Diagnóstico
```bash
curl http://localhost:8000/layers/tree
docker logs --tail 50 mapalab-dev-backend-1 2>&1 | grep -i error
```

### Acción
```bash
# Regenerar cache (ante cualquier duda)
cd /IIEG/mapalab && make refresh-layer-tree

# Si falla: cache corrupta → reset manual
docker exec -i -e PGPASSWORD='Bq7K!Ho6&B' dataengine-primary psql -U gisuser -d iieg_gis <<SQL
DELETE FROM mapalab.layer_tree_cache;
SQL
make refresh-layer-tree    # reconstruye desde layers

# Si todavía falla: la tabla layers está vacía/corrupta → ir a escenario 2
```

---

## Escenario 2: `mapalab.layers` está vacío o corrupto

### Síntoma
`SELECT COUNT(*) FROM mapalab.layers` devuelve 0 o los campos están mal.

### Acción — re-seed desde backup/JSON

```bash
# Opción A: si tienes el JSON más reciente exportado
cd /IIEG/dataengine
cd /IIEG/dataengine
./scripts/bootstrap-v14.sh --layers-json /path/to/layers_export.json   # en dataengine

# Opción B: restaurar desde backup diario de DataEngine
docker exec dataengine-backup /scripts/restore-from-latest.sh mapalab  # nombre aprox., ver dataengine docs
```

---

## Escenario 3: Stats (numeralia) desactualizadas

### Síntoma
`LayerDetailModal` muestra numeralia vieja o null.

### Acción
```bash
cd /IIEG/dataengine
make refresh   # elegir 'layer-stats'

# Si sigue fallando, verificar stats_config
docker exec -e PGPASSWORD='...' dataengine-primary psql -U mariachi_layers -d iieg_gis -c "
SELECT layer_key, jsonb_array_length(stats_config) AS cfg_count,
       jsonb_array_length(values) AS vals_count, values_refreshed_at
FROM mapalab.layer_stats
WHERE layer_key LIKE '%feminicidio%';
"
```

---

## Escenario 4: mariachi no puede escribir en DataEngine

### Síntoma
`POST /api/administrador/layers` devuelve 500.
```
sqlalchemy.exc.ProgrammingError: permission denied for schema mapalab
```

### Acción
```bash
# 1. Verificar que el rol existe y tiene permisos
docker exec -i -e PGPASSWORD='Bq7K!Ho6&B' dataengine-primary psql -U gisuser -d iieg_gis <<SQL
\du mariachi_layers
\dt mapalab.*
SELECT tableowner FROM pg_tables WHERE schemaname = 'mapalab';
SQL

# 2. Si los permisos están mal, re-aplicar grants
docker exec -i -e PGPASSWORD='<admin_pg>' dataengine-primary psql -U <admin_user> -d <dbname> <<SQL
ALTER SCHEMA mapalab OWNER TO mariachi_layers;
ALTER ROLE mariachi_layers SET search_path = mapalab, public;
-- nota: desde v1.7.0 el backend ya no lee de public.mapalab_card.
-- si la migracion 1-shot aun no corre, otorgar: GRANT SELECT ON public.mapalab_card TO mariachi_layers;
SQL

# 3. Restart mariachi-api
docker compose -p mariachi restart api
```

---

## Escenario 5: cron `dataengine-jobs` no se está ejecutando

### Síntoma
`mapalab.layer_tree_cache.updated_at` tiene > 24h desde el último refresh automático.

### Diagnóstico
```bash
docker exec dataengine-jobs cat /proc/1/comm     # debe decir "cron"
docker exec dataengine-jobs cat /etc/cron.d/jobs # verifica las 3 líneas
docker exec dataengine-jobs tail -50 /var/log/cron.log
```

### Acción
```bash
# Restart
cd /IIEG/dataengine
docker compose restart jobs

# Ejecución manual inmediata
make refresh   # elegir 'todos'
```

---

## Escenario 6: Frontend muestra capas con ETag stale

### Síntoma
Admin editó una capa pero el visor sigue mostrando la versión anterior incluso después de recargar.

### Diagnóstico
```bash
# ETag del backend
curl -D - -o /dev/null http://localhost:8000/layers/tree | grep -i etag

# Comparar con el que tiene el cliente (DevTools → Network → Headers)
```

### Acción
```bash
# 1. Invalidar cache en memoria del backend
curl -X POST http://localhost:8000/layers/invalidate-cache

# 2. Regenerar cache materializada si es necesario
cd /IIEG/mapalab && make refresh-layer-tree

# 3. Forzar al cliente a ignorar su cache local
# (navegador: Ctrl+Shift+R o DevTools → Network → Disable cache)
```

---

## Escenario 7: Rollback a versión anterior

### Estado: quiero deshacer los cambios de las últimas N aprobaciones

No hay rollback granular hoy (v1.5.x lo agrega con `layers_audit`). Opciones actuales:

```bash
# Opción A: restaurar snapshot del schema mapalab (si tienes backup puntual)
docker exec -i -e PGPASSWORD='...' dataengine-primary psql -U gisuser -d iieg_gis < /backups/mapalab_schema_YYYY-MM-DD.sql

# Opción B: re-seed completo desde JSON (sin tocar el Sheet ETL)
cd /IIEG/dataengine
./scripts/bootstrap-v14.sh --layers-json /path/to/known-good.json   # en dataengine
```

---

## Escenario 8: Migración Alembic falló a mitad

### Síntoma
```
alembic upgrade dataengine@head
→ error, partial schema
```

### Acción
```bash
# 1. Ver dónde quedó
docker run --rm --network=host -v /IIEG/mariachi/api:/app -w /app \
  -e DATAENGINE_DATABASE_URL="..." \
  python:3.12-slim bash -c "pip install alembic psycopg2-binary sqlalchemy pydantic pydantic-settings && alembic -x db=dataengine current"

# 2. Si es posible, downgrade y re-upgrade
alembic -x db=dataengine downgrade -1
alembic -x db=dataengine upgrade dataengine@head

# 3. Si está completamente roto, drop schema y bootstrap de nuevo
docker exec -i -e PGPASSWORD='...' dataengine-primary psql -U gisuser -d iieg_gis <<SQL
DROP SCHEMA mapalab CASCADE;
CREATE SCHEMA mapalab AUTHORIZATION mariachi_layers;
SQL
./scripts/bootstrap-v14.sh --layers-json /path/to/latest.json   # en dataengine
```

---

## Escenario 9: `EncodingError` en consola al activar capas (capas fantasma)

### Síntoma

En DevTools del navegador aparece, repetidamente, al activar capas o abrir un evento:

```
vendor-ol-*.js:1 EncodingError: The source image cannot be decoded.
```

En `import.meta.env.DEV` también verás:

```
[WMS imageloaderror] { layerId: 'auto-...', src: 'https://.../geoserver/.../wms?...', baseUrl: ..., params: { LAYERS: 'eventos:a,eventos:b,...', ... } }
```

### Causa típica

`useWMSLayerFactory` agrupa capas que comparten `baseUrl|wmsGroup` en una sola `GetMap`. Si **cualquiera** de las capas del bundle apunta a una tabla/schema PostGIS que no existe (capa fantasma), GeoServer responde un `ServiceException` XML con `HTTP 200` y `Content-Type: application/vnd.ogc.se_xml`. El browser intenta decodificarlo como PNG y rechaza con `EncodingError` → **todo el bundle falla**, no sólo la capa rota.

### Diagnóstico

```bash
# 1. Identificar la capa fallida en consola (log [WMS imageloaderror])
# Copia el src y prueba la request directa contra GeoServer:
curl -sk -o /tmp/wms.bin -w "HTTP_CODE:%{http_code}\nCONTENT_TYPE:%{content_type}\n" \
  "<src copiado del log>"
file /tmp/wms.bin
head -c 1000 /tmp/wms.bin
```

Si `file` reporta `XML 1.0 document` y `head` muestra `<ServiceException>...Schema 'X' does not exist...</ServiceException>`, tienes una capa fantasma cuyo nombre es `X`.

```bash
# 2. Confirmar que la tabla no existe en DataEngine
docker exec -e PGPASSWORD='Bq7K!Ho6&B' dataengine-primary psql -U gisuser -d iieg_gis -c "
SELECT table_name FROM information_schema.tables WHERE table_schema = '<workspace>' ORDER BY 1;
"

# 3. Encontrar la fila en mapalab.layers
docker exec -e PGPASSWORD='Bq7K!Ho6&B' dataengine-primary psql -U gisuser -d iieg_gis -c "
SELECT id, label, geoserver_layer, deleted_at FROM mapalab.layers
WHERE geoserver_layer = '<capa>';
"
```

### Acción

```bash
# Opción A (recomendada): soft-delete desde mariachi admin
# Login → árbol de capas → eliminar la(s) capa(s) fantasma → confirma
# Mariachi se encarga de auditoría + bump de cache-version

# Opción B (rápida, dev): soft-delete por SQL
docker exec -e PGPASSWORD='Bq7K!Ho6&B' dataengine-primary psql -U gisuser -d iieg_gis -c "
UPDATE mapalab.layers
SET deleted_at = now(), deleted_by = 'cleanup-ghost-<reason>'
WHERE id IN ('<id-1>', '<id-2>');
"

# Invalidar cache de árbol
curl -X POST http://localhost:3006/mapalab/api/layers/refresh-cache \
  -H "X-Internal-Token: $MAPALAB_INTERNAL_TOKEN"

# Verificar que ya no aparecen
curl -s http://localhost:3006/mapalab/api/layers/tree | jq '..|.id? // empty' | grep <patrón>
```

### Limpieza completa (opcional)

Las capas fantasma siguen publicadas en GeoServer (aparecen en `GetCapabilities`). Para evitar que mariachi las re-importe con `find_or_create_auto_leaf`:

1. **GeoServer admin**: unpublish la capa o quitarla del layer group correspondiente.
2. **DataEngine**: si la tabla **debería** existir, restaurarla desde un dump en `/IIEG/dataengine/restore/` con `make restore`.

---

## Contactos

- Infra DataEngine: equipo de infraestructura IIEG (no tenemos acceso directo a la VM en prod)
- GeoServer: mismo equipo
- Código mapalab/mariachi: mantenedor del repo (ver `CODEOWNERS`)

## Checklist rápido post-incidente

- [ ] Tree cache regenerado (`make refresh-layer-tree`)
- [ ] Periodicity actualizada (`make refresh`, opcion `periodicity`)
- [ ] Stats actualizadas (`make refresh   # elegir 'layer-stats'`)
- [ ] Frontend recarga con nuevo ETag
- [ ] Logs sin errores en mariachi-api, mapalab-backend, dataengine-jobs
- [ ] Si fue corrupción de datos: snapshot del schema mapalab antes de continuar ediciones
