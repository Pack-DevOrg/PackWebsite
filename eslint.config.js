import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

const isStrict =
  process.env.PACK_LINT_STRICT === '1' ||
  process.env.DONEAI_LINT_STRICT === '1';
const strictness = isStrict ? 'error' : 'warn';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: 'react',
              importNames: ['useEffect'],
              message:
                'Do not import useEffect directly. Prefer derived state, event handlers, TanStack Query, or useMountEffect for true mount-only external sync.',
            },
          ],
        },
      ],
      'no-restricted-properties': [
        'warn',
        {
          object: 'React',
          property: 'useEffect',
          message:
            'Do not call React.useEffect directly. Prefer derived state, event handlers, TanStack Query, or useMountEffect for true mount-only external sync.',
        },
      ],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/ban-ts-comment': strictness,
      '@typescript-eslint/no-explicit-any': strictness,
      '@typescript-eslint/no-require-imports': strictness,
      '@typescript-eslint/no-empty-object-type': strictness,
      '@typescript-eslint/no-unused-vars': strictness,
      'no-useless-escape': strictness,
      'prefer-const': strictness,
      'prefer-spread': strictness,
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
          enforceForJSX: true,
        },
      ],
    },
  },
  {
    files: ['src/hooks/useMountEffect.ts', 'src/hooks/useMountEffect.tsx'],
    rules: {
      'no-restricted-imports': 'off',
      'no-restricted-properties': 'off',
    },
  },
  {
    files: ['src/hooks/**/*.ts', 'src/hooks/**/*.tsx', 'src/pages/use*.ts', 'src/pages/use*.tsx'],
    rules: {
      'no-restricted-imports': 'off',
      'no-restricted-properties': 'off',
    },
  }
);
