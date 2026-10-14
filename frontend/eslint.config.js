import base from '@npmegar/eslint-config';
import react from '@npmegar/eslint-config/react';
import reactApp from '@npmegar/eslint-config/react-app';

const maxLines = (max) => ({
    'max-lines': ['error', { max, skipBlankLines: true, skipComments: true }],
});

export default [
    { ignores: ['public/**'] },
    ...base,
    ...react,
    ...reactApp,
    {
        languageOptions: {
            globals: {
                __APP_VERSION__: 'readonly',
                __APP_LOC__: 'readonly',
            },
        },
        settings: {
            'jsx-a11y': {
                components: {
                    Checkbox: 'input',
                    Switch: 'input',
                },
            },
        },
        rules: {
            'no-restricted-imports': ['error', {
                patterns: [{
                    group: ['*.png', '**/*.png'],
                    message: 'PNG imports no permitidos. Convierte a WebP (cwebp -lossless) o usa SVG. Si es estrictamente necesario, justifica en PR y usa eslint-disable-next-line.',
                }],
            }],
            'no-console': ['error', { allow: ['warn', 'error', 'info', 'debug'] }],
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/refs': 'off',
            'react-hooks/preserve-manual-memoization': 'off',
            'react-hooks/immutability': 'off',
        },
    },
    { files: ['*.config.js', 'scripts/**'], languageOptions: { globals: { process: 'readonly' } } },
    { files: ['scripts/**'], rules: { 'no-console': 'off' } },
    { files: ['**/utils/infoboxPlan.js'], rules: maxLines(430) },
    { files: ['**/useMapDrawing.js'], rules: maxLines(600) },
    { files: ['**/InfoBox/InfoBox.jsx'], rules: maxLines(400) },
    { files: ['**/releaseNotes.js'], rules: maxLines(1000) },
    { files: ['**/layers/definitions/seguridad.js'], rules: maxLines(400) },
    { files: ['**/MapSider.jsx'], rules: maxLines(320) },
];
