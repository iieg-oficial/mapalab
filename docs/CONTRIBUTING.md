# Guia de Contribucion

## Configuracion del entorno

1. Clonar el repo
2. Configurar git hooks: `make setup-hooks`
3. Copiar variables de entorno: `cp .env.example .env.development`
4. Levantar servicios: `make up`

## Flujo de trabajo con Git

### Ramas

- `develop`: rama principal de desarrollo
- `production`: rama de produccion (deploy automatico)
- `feature/<nombre>`: nuevas funcionalidades
- `fix/<nombre>`: correccion de bugs
- `refactor/<nombre>`: refactorizaciones

### Convencion de commits

Formato: `<tag>: <descripcion concisa>`

Tags disponibles:

| Tag | Uso |
|-----|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Correccion de bug |
| `refactor` | Reestructuracion sin cambio funcional |
| `docs` | Documentacion |
| `test` | Tests |
| `chore` | Tareas de mantenimiento |
| `ci` | Cambios en CI/CD |
| `style` | Formato, sin cambio funcional |
| `perf` | Mejora de rendimiento |

Ejemplo: `feat: add layer download in GeoJSON format`

### Pull Requests

- Describir que cambia y por que
- Asegurar que los tests pasan: `npm test` (frontend)
- Asegurar que el linter pasa: `npm run lint` (frontend)
- Revisar que `make up` y `make deploy` funcionan correctamente

## Convenciones de codigo

### Frontend

- Componentes React funcionales
- Tailwind CSS para estilos
- Aliases de importacion (`@components`, `@hooks`, `@services`, etc.)
- Tests con Vitest + Testing Library

### Backend

- Endpoints con FastAPI
- Modelos con SQLModel
- Variables de entorno via pydantic Settings

## Reporte de bugs

Abrir un issue con:
- Descripcion del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots si aplica
