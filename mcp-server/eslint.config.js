import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';
import importPlugin from 'eslint-plugin-import';
import preferArrow from 'eslint-plugin-prefer-arrow';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import perfectionist from 'eslint-plugin-perfectionist';
import typescriptSortKeys from 'eslint-plugin-typescript-sort-keys';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '*.log',
      '.bun/',
      'frontend/',
      'next-env.d.ts',
      '.next',
    ],
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      parserOptions: {
        project: true,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'unused-imports': unusedImports,
      'import': importPlugin,
      'prefer-arrow': preferArrow,
      'simple-import-sort': simpleImportSort,
      'perfectionist': perfectionist,
      'typescript-sort-keys': typescriptSortKeys,
    },
    rules: {
      // AGGRESSIVE UNUSED CODE DETECTION
      'unused-imports/no-unused-imports': 'error',

      // TYPESCRIPT UNUSED CODE RULES
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: false,
          allowTernary: false,
          allowTaggedTemplates: false,
        },
      ],
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/no-useless-empty-export': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unnecessary-type-arguments': 'error',
      '@typescript-eslint/no-unnecessary-qualifier': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      '@typescript-eslint/no-meaningless-void-operator': 'error',
      '@typescript-eslint/no-confusing-void-expression': 'error',
      '@typescript-eslint/prefer-reduce-type-parameter': 'error',
      '@typescript-eslint/prefer-return-this-type': 'error',

      // IMPORT/EXPORT RULES
      'import/no-unused-modules': process.env.LINT_IMPORTS ? 'error' : 'off',
      'import/no-unresolved': 'error',
      'import/no-extraneous-dependencies': 'error',
      'import/no-duplicates': 'error',
      'import/no-useless-path-segments': ['error', { noUselessIndex: true }],
      'import/no-relative-packages': 'error',
      'import/no-cycle': 'off', // Temporarily disabled for manual review
      'import/no-deprecated': 'error',

      // SORTING AND ORGANIZATION
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'perfectionist/sort-imports': 'off', // conflicts with simple-import-sort
      'perfectionist/sort-named-imports': 'error',
      'perfectionist/sort-exports': 'off',
      'perfectionist/sort-objects': 'error',
      'perfectionist/sort-object-types': 'error',
      'perfectionist/sort-interfaces': 'error',
      'perfectionist/sort-enums': 'error',
      'perfectionist/sort-array-includes': 'error',
      'typescript-sort-keys/interface': 'error',
      'typescript-sort-keys/string-enum': 'error',

      // PREFER ARROW FUNCTIONS (More lenient for auto-fixing)
      'prefer-arrow/prefer-arrow-functions': [
        'error',
        {
          disallowPrototype: true,
          singleReturnOnly: false,
          classPropertiesAllowed: true, // Allow class methods
          allowStandaloneDeclarations: true, // Allow standalone function declarations
        },
      ],

      // ADDITIONAL STRICT RULES
      'no-unused-labels': 'error',
      'no-unused-private-class-members': 'error',
      'no-unreachable': 'error',
      'no-unreachable-loop': 'error',
      'no-useless-call': 'error',
      'no-useless-catch': 'error',
      'no-useless-concat': 'error',
      'no-useless-constructor': 'error',
      'no-useless-escape': 'error',
      'no-useless-rename': 'error',
      'no-useless-return': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-backreference': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-constant-binary-expression': 'error',

      // TYPE CHECKING STRICTNESS (More lenient for auto-fixing)
      '@typescript-eslint/strict-boolean-expressions': [
        'warn',
        {
          allowString: true, // Allow string in conditionals
          allowNumber: true, // Allow number in conditionals
          allowNullableObject: true, // Allow nullable objects
          allowNullableBoolean: true,
          allowNullableString: true,
          allowNullableNumber: true,
          allowAny: true, // Temporarily allow any for auto-fixing
        },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn', // Warn instead of error for auto-fix
      '@typescript-eslint/no-unsafe-assignment': 'off', // Too strict for auto-fix
      '@typescript-eslint/no-unsafe-member-access': 'off', // Too strict for auto-fix
      '@typescript-eslint/no-unsafe-call': 'off', // Too strict for auto-fix
      '@typescript-eslint/no-unsafe-return': 'off', // Too strict for auto-fix
      '@typescript-eslint/no-unsafe-argument': 'off', // Too strict for auto-fix

      // PERFORMANCE AND BEST PRACTICES
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off', // too strict for Node.js applications
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/consistent-type-exports': 'error',

      // DEAD CODE ELIMINATION
      'no-dead-code': 'off', // not a real rule, handled by TypeScript
      'no-lone-blocks': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-empty-function': 'error',
      '@typescript-eslint/no-empty-function': 'error',
      '@typescript-eslint/no-empty-interface': 'error',

      // NODE.JS SPECIFIC RULES
      'no-console': 'off', // Allow console for server applications
      'no-process-exit': 'error',
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
    },
  },
);
