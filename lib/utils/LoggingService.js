import { appendFileSync, mkdirSync } from 'node:fs';
import { homedir, hostname } from 'node:os';
import { join } from 'node:path';
import { PLUGIN_NAME } from '../constant/pluginConstant.js';
function resolveLoggerMessage(message) {
    return typeof message === 'function' ? message() : message;
}
export function lazy(strings, 
// biome-ignore lint/suspicious/noExplicitAny: tagged template exprs are inherently untyped
...exprs) {
    const getters = exprs.map(expr => {
        if (typeof expr === 'function')
            return expr;
        return () => expr;
    });
    return () => strings.reduce((acc, str, i) => acc + str + (i < getters.length ? getters[i]() : ''), '');
}
// pino-compatible numeric levels
const LEVELS = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60,
};
const DEFAULT_LEVEL = LEVELS.warn;
function parseLevel(raw) {
    if (!raw)
        return DEFAULT_LEVEL;
    const asNumber = Number(raw);
    if (Number.isInteger(asNumber) && asNumber >= 0)
        return asNumber;
    // `in` walks the prototype chain, so `'__proto__' in LEVELS` is true —
    // raw comes from an untrusted env var, and Object.hasOwn checks own
    // properties only.
    const key = raw.toLowerCase();
    if (Object.hasOwn(LEVELS, key))
        return LEVELS[key];
    return DEFAULT_LEVEL;
}
const LOG_LEVEL_THRESHOLD = parseLevel(process.env['SF_LOG_LEVEL'] ?? process.env['SFDX_LOG_LEVEL']);
/**
 * Exposed so decorators/call-sites can skip building expensive log payloads
 * (lazy template closures, stringification) when the level isn't enabled.
 * Values mirror pino (trace=10, debug=20, info=30, warn=40, error=50, fatal=60).
 */
export const isLevelEnabled = (level) => level >= LOG_LEVEL_THRESHOLD;
export const LOG_LEVELS = LEVELS;
const MIRROR_TO_STDERR = process.env['SF_LOG_STDERR'] === 'true';
// Cached once at module load — hostname() is a syscall and pid is constant
// for the lifetime of the process. Avoids per-emit gethostname() overhead.
const HOSTNAME = hostname();
const PID = process.pid;
const LOG_DIR = join(homedir(), '.sf');
let dirEnsured = false;
function ensureLogDir() {
    if (dirEnsured)
        return;
    dirEnsured = true;
    try {
        mkdirSync(LOG_DIR, { recursive: true });
    }
    catch {
        // best-effort; swallow (read-only $HOME, sandboxed containers, etc.)
    }
}
function currentLogFilePath() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return join(LOG_DIR, `sf-${yyyy}-${mm}-${dd}.log`);
}
function emit(level, message, meta) {
    const entry = {
        level,
        time: Date.now(),
        pid: PID,
        hostname: HOSTNAME,
        name: PLUGIN_NAME,
        msg: message,
    };
    if (meta !== undefined)
        entry['meta'] = meta;
    const line = `${JSON.stringify(entry)}\n`;
    ensureLogDir();
    try {
        appendFileSync(currentLogFilePath(), line);
    }
    catch {
        // best-effort; swallow
    }
    if (MIRROR_TO_STDERR) {
        process.stderr.write(line);
    }
}
function logAt(level, message, meta) {
    if (level < LOG_LEVEL_THRESHOLD)
        return;
    emit(level, String(resolveLoggerMessage(message)), meta);
}
export const Logger = {
    trace(message, meta) {
        logAt(LEVELS.trace, message, meta);
    },
    debug(message, meta) {
        logAt(LEVELS.debug, message, meta);
    },
    info(message, meta) {
        logAt(LEVELS.info, message, meta);
    },
    warn(message, meta) {
        logAt(LEVELS.warn, message, meta);
    },
    error(message, meta) {
        logAt(LEVELS.error, message, meta);
    },
};
//# sourceMappingURL=LoggingService.js.map