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
cd /IIEG/mapalab-dataengine && make logs-jobs
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
cd /IIEG/mapalab-dataengine && make refresh-layer-tree

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
cd /IIEG/mapalab-dataengine
cd /IIEG/mapalab-dataengine
make prod-migration PROD_MIGRATION_FLAGS="--skip-etl --layers-json /path/to/layers_export.json"

# Opción B: restaurar desde backup diario de DataEngine
docker exec dataengine-backup /scripts/restore-from-latest.sh mapalab  # nombre aprox., ver dataengine docs
```

---

## Escenario 3: Stats (numeralia) desactualizadas

### Síntoma
`LayerDetailModal` muestra numeralia vieja o null.

### Acción
```bash
cd /IIEG/mapalab-dataengine
make refresh-layer-stats

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
cd /IIEG/mapalab-dataengine
docker compose restart jobs

# Ejecución manual inmediata
make refresh-all
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
cd /IIEG/mapalab-dataengine && make refresh-layer-tree

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
cd /IIEG/mapalab-dataengine
make prod-migration PROD_MIGRATION_FLAGS="--skip-etl --layers-json /path/to/known-good.json"
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
make prod-migration PROD_MIGRATION_FLAGS="--skip-etl --layers-json /path/to/latest.json"
```

---

## Contactos

- Infra DataEngine: equipo de infraestructura IIEG (no tenemos acceso directo a la VM en prod)
- GeoServer: mismo equipo
- Código mapalab/mariachi: mantenedor del repo (ver `CODEOWNERS`)

## Checklist rápido post-incidente

- [ ] Tree cache regenerado (`make refresh-layer-tree`)
- [ ] Periodicity actualizada (`make refresh-periodicity`)
- [ ] Stats actualizadas (`make refresh-layer-stats`)
- [ ] Frontend recarga con nuevo ETag
- [ ] Logs sin errores en mariachi-api, mapalab-backend, dataengine-jobs
- [ ] Si fue corrupción de datos: snapshot del schema mapalab antes de continuar ediciones
