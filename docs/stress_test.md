# Stress Test — Mapalab IIEG

Herramienta de prueba de carga para `https://iieg.jalisco.gob.mx/mapalab/mapa`.

Simula visitas completas de usuarios reales y detecta automáticamente el punto en que el servidor comienza a fallar.

---

## Cómo simula un usuario real

Cada usuario ejecuta estos 3 pasos en orden, igual que un navegador:

1. **GET página principal** — descarga el HTML con headers de Chrome real (`User-Agent`, `Accept-Language: es-MX`, `Sec-Fetch-*`, cookies de sesión propias)
2. **GET de assets CSS/JS en paralelo** — extrae todos los archivos `.css` y `.js` del HTML y los descarga simultáneamente (máximo 25), igual que haría un navegador al renderizar
3. **Think time aleatorio 1–3 s** — simula que el usuario lee e interactúa con la página antes de la siguiente acción

Cada usuario tiene su propio **cookie jar independiente**, simulando navegadores distintos.

---

## Instalación

```bash
pip install aiohttp
```

---

## Uso

### Modo rampa (recomendado para encontrar el punto de quiebre)

Sube la carga gradualmente en pasos hasta llegar al máximo. Se detiene automáticamente al detectar quiebre.

```bash
python stress_test.py --mode ramp --users 200 --ramp-steps 10 --sessions 1
```

### Modo fijo (para validar resistencia a una carga concreta)

Lanza exactamente N usuarios simultáneos, cada uno hace su número de sesiones y termina.

```bash
python stress_test.py --mode fixed --users 80 --sessions 3
```

---

## Parámetros

| Parámetro | Default | Descripción |
|---|---|---|
| `--mode` | `ramp` | `ramp`: sube carga gradualmente \| `fixed`: carga fija |
| `--users` | `100` | Número máximo de usuarios simultáneos |
| `--sessions` | `1` | Número de visitas completas que hace cada usuario |
| `--ramp-steps` | `5` | Número de escalones en modo `ramp` |
| `--step-duration` | `20` | *(no tiene efecto actualmente)* La duración real la determina el servidor |
| `--duration` | `60` | *(no tiene efecto actualmente)* La duración real la determina el servidor |

### Ejemplos prácticos

```bash
# Flujo recomendado:

# 1. Encontrar el umbral con rampa de 10 pasos
python stress_test.py --mode ramp --users 200 --ramp-steps 10

# 2. Si el quiebre ocurrió en 120 usuarios, validar que aguanta sostenido en 80
python stress_test.py --mode fixed --users 80 --sessions 5

# 3. Prueba rápida de un solo nivel de carga
python stress_test.py --mode ramp --users 50 --ramp-steps 1 --sessions 3
```

---

## Cómo leer el reporte

### Durante la prueba (por paso)

```
▶  Paso 3/5: 60 usuarios × 1 sesión(es) = 60 sesiones ...
   OK       58/60 OK  error 3.3%  12.4s
──────────────────────────────────────────────────────────────────────
  Paso 3 — 60 usuarios × 1 sesión(es)
  ✅ ESTABLE   |  👥   60 usuarios  |  📦    60 sesiones  |  ⏱  12.4s
  OK:    58   Errores:     2   Error rate: 3.3%
  RPS carga: 4.84  |  RPS servidor (real): 31.20
  Latencia → Avg: 820ms  Med: 750ms  p90: 1200ms  p95: 1450ms  p99: 2100ms
  Códigos HTTP → HTTP 200: 58  HTTP 503: 2
```

| Campo | Significado |
|---|---|
| `✅ ESTABLE` / `💥 QUIEBRE` | Si esta fase superó los criterios de quiebre |
| `Error rate` | % de sesiones que fallaron (HTTP ≥ 400, timeout o error de conexión) |
| `RPS carga` | Sesiones completadas por segundo — incluye think time, siempre bajo |
| `RPS servidor (real)` | Throughput real del servidor — solo tiempo de red, sin think time |
| `Avg` | Latencia promedio de la página principal |
| `p95` | El 95% de los usuarios recibió respuesta en ≤ este tiempo |
| `p99` | El 99% de los usuarios recibió respuesta en ≤ este tiempo |

### Reporte final

```
══════════════════════════════════════════════════════════════════════
  📋 RESUMEN FINAL
  Criterios de quiebre: error rate > 30.0%  |  p95 > 4000 ms
──────────────────────────────────────────────────────────────────────
  🏆 Última fase estable     :   80 usuarios  error 4.1%  p95 1850ms
  🏆 Máx RPS servidor (real) : 47.30 rps  @ 60 usuarios  ← throughput máximo
  💥 Punto de quiebre        :  100 usuarios  error 38.5%  p95 9200ms
══════════════════════════════════════════════════════════════════════
```

- **Última fase estable** — máxima carga que el servidor soporta dentro de los umbrales
- **Máx RPS servidor** — en qué nivel de carga el servidor procesó más peticiones por segundo
- **Punto de quiebre** — primer nivel donde se superaron los criterios de quiebre

---

## Criterios de quiebre

El script se detiene automáticamente cuando una fase supera **cualquiera** de estos umbrales, configurables al inicio del archivo:

| Constante | Default | Significado |
|---|---|---|
| `BREAK_ERROR_RATE` | `30.0` | % de sesiones fallidas |
| `BREAK_P95_MS` | `4000` | Latencia p95 en milisegundos |

### Referencia de latencias para apps de mapas

| p95 | Experiencia |
|---|---|
| < 1,000 ms | Excelente |
| 1,000 – 2,500 ms | Buena |
| 2,500 – 4,000 ms | Aceptable |
| 4,000 – 8,000 ms | Degradada |
| > 8,000 ms | Inaceptable |

---

## Por qué una sesión puede fallar

Una sesión se cuenta como fallida (`success = False`) si ocurre cualquiera de:

- **`TIMEOUT`** — el servidor no respondió en 30 s (cola de procesamiento llena)
- **`CONNECTION_ERROR`** — el servidor rechazó la conexión (slots de Nginx agotados)
- **`HTTP 5xx`** — el servidor respondió con error interno (500, 502, 503)
- **`HTTP 429`** — demasiadas peticiones (rate limiting activo)

### Patrón típico de saturación

```
Carga baja  → latencias normales, 0% error
Carga media → p95 empieza a subir (servidor encola peticiones)
Carga alta  → aparecen TIMEOUT (cola llena)
Saturación  → CONNECTION_ERROR / HTTP 503 (servidor rechaza)
```

---

## Diferencia entre usuarios y sesiones

- **Usuario** — proceso simultáneo activo durante el paso
- **Sesión** — visita completa individual (HTML + assets + think time)
- Un usuario con `--sessions 3` hace 3 visitas en secuencia

Con `--users 50 --sessions 3` → 50 usuarios simultáneos, 150 sesiones totales, cada usuario hace sus 3 visitas una tras otra.
