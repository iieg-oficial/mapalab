import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default [
    { ignores: ['dist'] },
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: {
                ...globals.browser,
                __APP_VERSION__: 'readonly',
            },
            parserOptions: {
                ecmaVersion: 'latest',
                ecmaFeatures: { jsx: true },
                sourceType: 'module',
            },
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            'jsx-a11y': jsxA11y,
        },
        settings: {
            'jsx-a11y': {
                components: {
                    Checkbox: 'input',
                    Switch: 'input',
                }
            }
        },
        rules: {
            ...js.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            ...jsxA11y.flatConfigs.recommended.rules,
            'indent': ['error', 4],
            'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
            'no-restricted-imports': ['error', {
                patterns: [{
                    group: ['*.png', '**/*.png'],
                    message: 'PNG imports no permitidos. Convierte a WebP (cwebp -lossless) o usa SVG. Si es estrictamente necesario, justifica en PR y usa eslint-disable-next-line.'
                }]
            }],
            'max-lines': ['error', {
                'max': 300,
                'skipBlankLines': true,
                'skipComments': true
            }],
            'quotes': ['error', 'single', {
                'avoidEscape': true,
                'allowTemplateLiterals': true
            }],
            'template-curly-spacing': ['error', 'never'],
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/refs': 'off',
            'react-hooks/preserve-manual-memoization': 'off',
            'react-hooks/immutability': 'off',
            'react-hooks/exhaustive-deps': 'warn',
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
        },
    },
    {
        files: ['**/useMapDrawing.js'],
        rules: {
            'max-lines': ['error', {
                'max': 600,
                'skipBlankLines': true,
                'skipComments': true
            }],
        },
    },
    {
        files: ['**/test/**/*.{js,jsx}', '**/*.test.{js,jsx}'],
        languageOptions: {
            globals: globals.node,
        },
    },
    {
        files: ['**/layers/definitions/seguridad.js'],
        rules: {
            'max-lines': ['error', {
                'max': 400,
                'skipBlankLines': true,
                'skipComments': true
            }],
        },
    },
]
