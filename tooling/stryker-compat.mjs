import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'

// Temporary shims that let Stryker 10 run against this repository's
// TypeScript 7 and Vitest 5. The test:mutation scripts load this file
// through NODE_OPTIONS, so every process Stryker forks (checkers, test
// runners) inherits it; nothing else does.
//
// Each source patch throws when its target text is gone, so a Stryker
// release that fixes the issue upstream fails the run here instead of
// silently patching nothing. Remove that shim when it does; once both are
// gone, delete this file, the NODE_OPTIONS env entries in package.json and
// the @typescript/typescript6 devDependency.

const STRYKER_MODULES = '/node_modules/@stryker-mutator/'
const VITEST_RUNNER_SRC = `${STRYKER_MODULES}vitest-runner/dist/src/`

// 1. TypeScript 7 is a native port: its `typescript` package exports only
// `version`. Stryker reads the tsconfig (core's TSConfigPreprocessor) and
// type-checks mutants (@stryker-mutator/typescript-checker) through the
// removed JavaScript API, and fails with `ts.parseConfigFileTextToJson is
// not a function` (stryker-mutator/stryker-js#6110). Resolve `typescript`
// to the TypeScript 6 API published as @typescript/typescript6, for
// Stryker's own modules only: the project still builds with TypeScript 7.
const resolveTypescript6 = (specifier, context) =>
  specifier === 'typescript' && context.parentURL?.includes(STRYKER_MODULES)
    ? '@typescript/typescript6'
    : specifier

// 2. Vitest 5 matches `testNamePattern` against the suite chain joined with
// ' > ', but @stryker-mutator/vitest-runner still joins it with ' '. The
// per-mutant test filter then matches nothing, every test is skipped, and
// every covered mutant is reported Survived (stryker-mutator/stryker-js#6210).
// The separator lives in two copies that must agree, because the test ids
// recorded during coverage are matched against the ids of test results:
// the runner's own helper, and the setup file it copies into the sandbox
// (read with fs, so it is patched where the runner reads it).
const NAME_JOIN = "nameParts.join(' ')"
const VITEST_5_NAME_JOIN = "nameParts.join(' > ')"
const SETUP_READ = "await fs.promises.readFile(STRYKER_SETUP, 'utf8')"

const replaceOnce = (source, file, from, to) => {
  if (!source.includes(from)) {
    throw new Error(
      `tooling/stryker-compat.mjs: ${file} no longer contains ${from}. Stryker has likely fixed this upstream; remove the shim.`
    )
  }
  return source.replace(from, to)
}

const patchVitestRunner = (url, source) => {
  const file = url.slice(url.indexOf(VITEST_RUNNER_SRC) + 1)
  if (url.endsWith(`${VITEST_RUNNER_SRC}test-helpers.js`)) {
    return replaceOnce(source, file, NAME_JOIN, VITEST_5_NAME_JOIN)
  }
  if (url.endsWith(`${VITEST_RUNNER_SRC}vitest-test-runner.js`)) {
    const setup = new URL('./stryker-setup.js', url)
    replaceOnce(readFileSync(setup, 'utf8'), setup.pathname, NAME_JOIN, '')
    return replaceOnce(
      source,
      file,
      SETUP_READ,
      `(${SETUP_READ}).replace(${JSON.stringify(NAME_JOIN)}, ${JSON.stringify(VITEST_5_NAME_JOIN)})`
    )
  }
  return source
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(resolveTypescript6(specifier, context), context)
  },
  load(url, context, nextLoad) {
    const result = nextLoad(url, context)
    if (!url.includes(VITEST_RUNNER_SRC) || result.source == null) {
      return result
    }
    const source =
      typeof result.source === 'string'
        ? result.source
        : new TextDecoder().decode(result.source)
    const patched = patchVitestRunner(url, source)
    return patched === source ? result : { ...result, source: patched }
  },
})
