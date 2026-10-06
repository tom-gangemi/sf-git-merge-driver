export default {
  entry: [
    '.github/**/*.yml',
    '**/*.{nut,test}.ts',
    'test/perf/**/*.{ts,mjs}',
    'bin/dev.js',
    'bin/run.js',
    'src/bin/driver.ts',
  ],
  project: ['**/*.{ts,js}'],
  // tsx is loaded through indirections knip cannot follow: the `import=tsx`
  // node-option in .mocharc.json and the bin/dev.js shebang. Likewise
  // @typescript/typescript6, which tooling/stryker-compat.mjs substitutes
  // for `typescript` when Stryker resolves it.
  ignoreDependencies: [
    '@commitlint/config-conventional',
    '@typescript/typescript6',
    'tsx',
  ],
  ignore: ['vitest.config.perf.ts'],
}
