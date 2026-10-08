export type LoggerMessage<T = string> = T | (() => T);
export declare function lazy(strings: TemplateStringsArray, ...exprs: any[]): () => string;
/**
 * Exposed so decorators/call-sites can skip building expensive log payloads
 * (lazy template closures, stringification) when the level isn't enabled.
 * Values mirror pino (trace=10, debug=20, info=30, warn=40, error=50, fatal=60).
 */
export declare const isLevelEnabled: (level: number) => boolean;
export declare const LOG_LEVELS: {
    readonly trace: 10;
    readonly debug: 20;
    readonly info: 30;
    readonly warn: 40;
    readonly error: 50;
    readonly fatal: 60;
};
export declare const Logger: {
    trace<T = string>(message: LoggerMessage<T>, meta?: unknown): void;
    debug<T = string>(message: LoggerMessage<T>, meta?: unknown): void;
    info<T = string>(message: LoggerMessage<T>, meta?: unknown): void;
    warn<T = string>(message: LoggerMessage<T>, meta?: unknown): void;
    error<T = string>(message: LoggerMessage<T>, meta?: unknown): void;
};
