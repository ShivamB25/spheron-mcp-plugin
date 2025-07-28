module.exports = {
  // AGGRESSIVE FORMATTING FOR CONSISTENCY
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'consistent',
  jsxSingleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  
  // STRICT BRACKET AND SPACING RULES
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  
  // CONSISTENT LINE ENDINGS AND FORMATTING
  endOfLine: 'lf',
  insertPragma: false,
  requirePragma: false,
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'css',
  vueIndentScriptAndStyle: false,
  embeddedLanguageFormatting: 'auto',
  
  // OVERRIDE SPECIFIC FILE TYPES FOR AGGRESSIVE FORMATTING
  overrides: [
    {
      files: '*.{ts,tsx}',
      options: {
        parser: 'typescript',
        trailingComma: 'all',
        semi: true,
        singleQuote: true,
        jsxSingleQuote: true,
        printWidth: 100,
        tabWidth: 2,
      },
    },
    {
      files: '*.{js,jsx}',
      options: {
        parser: 'babel',
        trailingComma: 'all',
        semi: true,
        singleQuote: true,
        jsxSingleQuote: true,
      },
    },
    {
      files: '*.json',
      options: {
        parser: 'json',
        trailingComma: 'none',
        printWidth: 120,
      },
    },
    {
      files: '*.{css,scss,less}',
      options: {
        parser: 'css',
        singleQuote: false,
      },
    },
    {
      files: '*.md',
      options: {
        parser: 'markdown',
        proseWrap: 'always',
        printWidth: 80,
      },
    },
    {
      files: '*.{yaml,yml}',
      options: {
        parser: 'yaml',
        tabWidth: 2,
        singleQuote: true,
      },
    },
  ],
};