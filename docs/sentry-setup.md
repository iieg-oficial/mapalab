# Activar Sentry

Guía paso a paso para activar el error tracking de Sentry en MapaLab. El código ya está integrado — solo falta la configuración en Sentry y agregar los secrets.

> Si en algún momento se decide migrar a self-hosted, ver `docs/planes/PLAN_GLITCHTIP.md`. La integración del frontend no cambia — solo se reemplaza el DSN.

## 1. Crear cuenta y proyecto en Sentry

1. Ir a https://sentry.io/signup/ y crear una cuenta (o usar una existente).
2. Crear una **organización** (ej. `iieg`).
3. Crear un **proyecto**:
   - Platform: **React**
   - Project name: `mapalab`
   - Team: default
4. Sentry mostrará un snippet de onboarding con el DSN. **Copiar el DSN** — tiene este formato:
   ```
   https://<public_key>@o<org_id>.ingest.sentry.io/<project_id>
   ```

## 2. Generar auth token (para subir sourcemaps)

Sin sourcemaps, los stack traces llegan minificados (`a.b.c(x)` en vez de `HomeComponent.handleClick`). Para deofuscarlos necesitas un auth token.

1. En Sentry: **Settings → Account → API → Auth Tokens → Create New Token**.
2. Nombre: `mapalab-ci-sourcemaps`.
3. Scopes:
   - `project:read`
   - `project:releases`
   - `org:read`
4. Copiar el token — se muestra **una sola vez**.

## 3. Agregar secrets en GitHub

En el repo de GitHub: **Settings → Secrets and variables → Actions → Environments → production → Environment secrets**.

Agregar:

| Secret | Valor | Ejemplo |
|---|---|---|
| `SENTRY_DSN` | El DSN del paso 1 | `https://abc123@o456.ingest.sentry.io/789` |
| `SENTRY_AUTH_TOKEN` | El token del paso 2 | `sntrys_eyJpYXQ...` |
| `SENTRY_ORG` | Slug de la organización | `iieg` |
| `SENTRY_PROJECT` | Slug del proyecto | `mapalab` |
| `SENTRY_URL` | URL base de Sentry | `https://sentry.io/` |

> `SENTRY_DSN` es **público** por diseño (se embebe en el bundle del navegador). Aun así se guarda como secret para poder cambiarlo sin tocar código.
>
> `SENTRY_AUTH_TOKEN` es **privado** — nunca aparece en el bundle, solo se usa en CI para subir sourcemaps.

## 4. Configurar `.env.production` local (solo el host de deploy)

En el servidor de producción, en `/home/<user>/mapalab/.env.production`:

```bash
VITE_SENTRY_DSN=https://abc123@o456.ingest.sentry.io/789
```

El resto de variables `SENTRY_*` NO se ponen aquí — solo las necesita CI durante el build.

## 5. (Opcional) Probar en desarrollo

Si quieres validar localmente antes de mergear a producción:

1. Agregar a `.env.development`:
   ```bash
   VITE_SENTRY_DSN=https://abc123@o456.ingest.sentry.io/789
   ```
2. Levantar `make dev`.
3. En la consola del navegador, ejecutar:
   ```js
   Sentry.captureException(new Error('test desde mapalab dev'))
   ```
   (Si `Sentry` no está disponible en `window`, importarlo o usar la integración que ya loggea errores no capturados.)
4. En Sentry → Issues: debería aparecer el error en ~10 segundos.

Para desactivar en dev, dejar `VITE_SENTRY_DSN` vacío — el SDK no se inicializa.

## 6. Validar en producción

Después del primer deploy con los secrets configurados:

1. Abrir `https://mapalab-iieg.app/mapa` y forzar un error desde consola:
   ```js
   throw new Error('test de integración')
   ```
2. En Sentry → Issues debería aparecer en ~30 seg con:
   - Stack trace **deofuscado** (nombres de archivo `.jsx`, números de línea reales).
   - Tag de release `mapalab@<version>`.
   - Environment: `production`.
   - Browser, OS, URL.
3. Si el stack trace aparece minificado, revisar los logs del CI — el step `Build` debería mostrar `Successfully uploaded X sourcemaps`.

## 7. Ajustes recomendados en Sentry

### Alertas
- **Settings → Alerts → Create Alert**.
- Regla sugerida: "A new issue is created" (notifica sobre regresiones).
- Integración: Discord webhook (se puede reusar el `DISCORD_WEBHOOK_URL` del CI/CD).

### Retención
- Free tier: 30 días, fijo.
- Team/Business: configurable 30/90 días.

### Sampling
- En `main.jsx`: `tracesSampleRate: 0.1` (10% de sesiones con traces de performance en prod).
- Para arrancar, subirlo a 1.0 si los volúmenes son bajos (<1K sesiones/día). Bajar si se acerca al límite mensual.

### Ignorar ruido
Ya configurado en `main.jsx`:
```js
denyUrls: [/youtubei\/v1/, /google-analytics/, /googletagmanager/, /doubleclick\.net/]
```

Si aparecen errores recurrentes de extensiones o scripts externos, agregar sus dominios al array y redeploy.

## 8. Plan gratuito (Developer)

Al momento de escribir:
- **5K errores/mes** capturados (suficiente para un sitio con <10K visitantes únicos/día en estado estable).
- **10K performance events/mes**.
- **50 session replays/mes** (feature opcional, no activado por defecto).
- Retención: **30 días**.

Si se pasa del límite, Sentry deja de aceptar eventos hasta el siguiente ciclo (no cobra automáticamente a menos que se active pago).

## 9. Si se quiere apagar Sentry

1. Borrar `SENTRY_DSN` del entorno (o dejar vacío).
2. Redeploy.

El código sigue en el repo pero el SDK no se inicializa. No requiere revert.

## 10. Migrar a GlitchTip en el futuro

Cuando se quiera self-hosted para tener los datos en infra IIEG:

1. Ejecutar `docs/planes/PLAN_GLITCHTIP.md`.
2. Cambiar `SENTRY_DSN` por el DSN del GlitchTip.
3. Cambiar `SENTRY_URL` a `https://iieg.app/glitchtip/`.
4. Re-generar `SENTRY_AUTH_TOKEN` desde la UI de GlitchTip.
5. Redeploy.

Ningún cambio de código. El SDK es API-compatible.

## Troubleshooting

### Los errores aparecen minificados
- Verificar que `SENTRY_AUTH_TOKEN` esté seteado en CI.
- Ver logs del step `Build`: buscar `Successfully uploaded X sourcemaps`.
- Verificar que `build.sourcemap` esté activo (en `vite.config.js` ya lo está cuando `SENTRY_AUTH_TOKEN` existe).

### No llegan eventos aunque el DSN esté configurado
- Revisar consola del navegador: si aparecen CORS errors o 403 de `sentry.io`, puede ser que un adblocker esté bloqueando. Sentry tiene [instrucciones para usar un tunnel](https://docs.sentry.io/platforms/javascript/troubleshooting/#dealing-with-ad-blockers).
- Verificar que `import.meta.env.VITE_SENTRY_DSN` esté definido al runtime — en DevTools: `console.log(import.meta.env.VITE_SENTRY_DSN)`.

### Muchos errores de scripts externos (GTM, YouTube, extensiones)
- Agregar patrones al array `denyUrls` en `main.jsx`.
- O usar `Sentry.init({ ignoreErrors: ['ResizeObserver loop', 'Non-Error promise rejection'] })` para mensajes específicos.

### Release no aparece
- El `release` se setea en `main.jsx` como `mapalab@${__APP_VERSION__}`.
- `__APP_VERSION__` viene de `package.json → version` via Vite `define`.
- En CI el `sentryVitePlugin` crea el release automáticamente al subir sourcemaps.
