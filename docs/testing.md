# Testing con Vitest

Este proyecto usa [Vitest](https://vitest.dev/) para testing con las siguientes librerias:
- **@testing-library/react**: Testing de componentes React
- **@testing-library/jest-dom**: Matchers adicionales para el DOM
- **happy-dom**: Entorno DOM para Node.js (alternativa ligera a jsdom)

## Comandos

```bash
# Tests en modo watch (desarrollo)
npm test

# Tests una sola vez
npx vitest run

# Interfaz visual
npm run test:ui

# Cobertura
npm run test:coverage
```

## Inventario de tests — 33 archivos, 469 tests

### Componentes UI (6 archivos — 79 tests)

| Archivo | Tests |
|---|---|
| `components/Alert.test.jsx` | 15 |
| `components/Badge.test.jsx` | 27 |
| `components/Checkbox.test.jsx` | 12 |
| `components/LottieSpinner.test.jsx` | 2 |
| `components/Modal.test.jsx` | 12 |
| `components/Switch.test.jsx` | 11 |

### Hooks generales (4 archivos — 28 tests)

| Archivo | Tests |
|---|---|
| `hooks/useDebounce.test.js` | 6 |
| `hooks/useFeatureSeen.test.js` | 7 |
| `hooks/useOutsideClick.test.js` | 7 |
| `hooks/useScrollOverflow.test.js` | 8 |

### Hooks del mapa (11 archivos — 149 tests)

| Archivo | Tests |
|---|---|
| `pages/maps/hooks/useAccordion.test.js` | 12 |
| `pages/maps/hooks/useActiveLayersLogic.test.js` | 3 |
| `pages/maps/hooks/useCQLFilter.test.js` | 18 |
| `pages/maps/hooks/useDateLoop.test.js` | 13 |
| `pages/maps/hooks/useDateSelections.test.js` | 26 |
| `pages/maps/hooks/useInitializeFromUrl.test.js` | 19 |
| `pages/maps/hooks/useLayerManagement.test.js` | 16 |
| `pages/maps/hooks/useLayerOpacity.test.js` | 9 |
| `pages/maps/hooks/useLayerToggle.test.js` | 8 |
| `pages/maps/hooks/useUrlSync.test.js` | 13 |
| `pages/maps/hooks/useWMSLayerManager.test.js` | 12 |

### Helpers del mapa (3 archivos — 58 tests)

| Archivo | Tests |
|---|---|
| `pages/maps/helpers/dateFilterHelpers.test.js` | 8 |
| `pages/maps/helpers/layerHelpers.test.js` | 22 |
| `pages/maps/helpers/wmsConfig.test.js` | 28 |

### Componentes del mapa (1 archivo — 14 tests)

| Archivo | Tests |
|---|---|
| `pages/maps/components/InfoBox/utils/renderCard.helpers.test.js` | 14 |

### Servicios (6 archivos — 116 tests)

| Archivo | Tests |
|---|---|
| `services/analyticsService.test.js` | 21 |
| `services/downloadService.test.js` | 21 |
| `services/layerExtentService.test.js` | 8 |
| `services/layerMetadataService.test.js` | 14 |
| `services/searchConfig.test.js` | 24 |
| `services/searchService.test.js` | 28 |

### Utils (1 archivo — 22 tests)

| Archivo | Tests |
|---|---|
| `utils/featureInfoUtils.test.js` | 22 |

### Otros (1 archivo — 3 tests)

| Archivo | Tests |
|---|---|
| `example.test.jsx` | 3 |

## Estructura de tests

Convencion `*.test.js` / `*.test.jsx`, ubicados en `src/test/`:

```
src/test/
├── setup.js
├── example.test.jsx
├── components/
├── hooks/
├── pages/maps/
│   ├── components/InfoBox/utils/
│   ├── helpers/
│   └── hooks/
├── services/
└── utils/
```

## Escribir un test

### Componente

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MiComponente from './MiComponente';

describe('MiComponente', () => {
    it('should render correctly', () => {
        render(<MiComponente />);
        expect(screen.getByText('Hola')).toBeInTheDocument();
    });
});
```

### Funciones puras

```js
import { describe, it, expect } from 'vitest';
import { miFuncion } from '@pages/maps/helpers/miHelper';

describe('miFuncion', () => {
    it('retorna el valor esperado', () => {
        expect(miFuncion('input')).toBe('output');
    });
});
```

### Servicios con mocks

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@pages/maps/helpers/layers', () => ({
    layers: [],
    findLayerById: vi.fn()
}));

beforeEach(() => {
    global.fetch = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});
```

## Matchers utiles de jest-dom

```jsx
expect(element).toBeInTheDocument()
expect(element).toHaveTextContent('texto')
expect(element).toHaveClass('clase')
expect(element).toBeVisible()
expect(element).toBeDisabled()
expect(element).toHaveAttribute('attr', 'value')
```

## Validación complementaria

Además de los tests, el pipeline local corre:

| Comando | Qué valida |
|---|---|
| `npm run lint` | Reglas ESLint (a11y + `no-restricted-imports` para PNG imports) |
| `npm run check:dead-code` | Código/exports/dependencias muertas (informativo, con knip) |
| `npm run check:dead-code:strict` | Lo mismo pero bloqueante — corre en pre-push y CI |
| `npm run test:coverage -- --run` | Tests + coverage contra thresholds — corre en CI |
| `npm run build` | Verifica que el bundle se genere limpio (usado en CI) |

Los git hooks en `.githooks/` (ver `docs/ci-cd.md`) ejecutan estas validaciones automáticamente en pre-commit (ESLint sobre archivos staged via `lint-staged`) y pre-push (lint + tests + knip).

### Coverage thresholds

Configurados en `vitest.config.js` para prevenir erosión de cobertura:

| Métrica | Threshold | Baseline actual |
|---|---|---|
| lines | 60% | 64.36% |
| functions | 65% | 70.71% |
| branches | 40% | 45.48% |
| statements | 55% | 61.91% |

Si la cobertura baja por debajo del threshold, el CI falla. Para subir el baseline, levantar los números gradualmente conforme se agreguen tests.
