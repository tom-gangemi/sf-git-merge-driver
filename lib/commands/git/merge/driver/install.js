import { __decorate } from "tslib";
import { createInterface } from 'node:readline';
import { Messages } from '@salesforce/core';
import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { PLUGIN_NAME } from '../../../../constant/pluginConstant.js';
import { formatInstallDryRunReport, shouldPromptForPolicy, } from '../../../../service/InstallReports.js';
import { InstallConflictError, InstallService, } from '../../../../service/InstallService.js';
import { log } from '../../../../utils/LoggingDecorator.js';
import { Logger } from '../../../../utils/LoggingService.js';
/**
 * Map a raw terminal answer to a `ConflictPolicy`. Pure — exported so
 * the answer classifier can be table-tested directly (tight feedback
 * loop for mutation testing); also used by `defaultPolicyPrompt` below.
 */
export const parsePromptAnswer = (raw) => {
    const normalised = raw.trim().toLowerCase();
    if (normalised === 's' || normalised === 'skip')
        return 'skip';
    if (normalised === 'o' || normalised === 'overwrite')
        return 'overwrite';
    return 'abort';
};
const defaultPolicyPrompt = async (conflicts) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
        process.stdout.write(`\n${conflicts.length} pattern(s) already configured with a different merge driver:\n`);
        for (const c of conflicts) {
            process.stdout.write(`  ${c.pattern} → merge=${c.existingDriver}\n`);
        }
        process.stdout.write('\nHow should we proceed?\n' +
            '  [a] abort     (safe, no changes)\n' +
            '  [s] skip      (leave those globs with the other driver)\n' +
            '  [o] overwrite (replace; uninstall will restore)\n');
        const answer = await new Promise(resolve => {
            // An early stdin EOF (e.g., piped empty input, detached TTY)
            // would otherwise leave `rl.question`'s callback unresolved —
            // 'close' fires in that case, so we resolve with '' and let
            // parsePromptAnswer fall back to 'abort'.
            rl.once('close', () => resolve(''));
            rl.question('Enter a / s / o [a]: ', resolve);
        });
        return parsePromptAnswer(answer);
    }
    finally {
        rl.close();
    }
};
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages(PLUGIN_NAME, 'install');
const CONFLICT_POLICIES = [
    'abort',
    'skip',
    'overwrite',
];
export default class Install extends SfCommand {
    static summary = messages.getMessage('summary');
    static aliases = [
        'git:merge:driver:enable',
    ];
    static description = messages.getMessage('description');
    static examples = messages.getMessages('examples');
    static flags = {
        'dry-run': Flags.boolean({
            summary: messages.getMessage('flags.dry-run.summary'),
            default: false,
        }),
        'on-conflict': Flags.option({
            summary: messages.getMessage('flags.on-conflict.summary'),
            options: CONFLICT_POLICIES,
            default: 'abort',
        })(),
        force: Flags.boolean({
            summary: messages.getMessage('flags.force.summary'),
            default: false,
        }),
    };
    /**
     * Hook for tests — overrides the interactive prompt implementation.
     * Kept protected so test doubles can swap in without going through
     * readline. In production, stdout-isTTY is the gate; in tests the
     * caller supplies a stub.
     */
    promptPolicy = defaultPolicyPrompt;
    async run() {
        const { flags } = await this.parse(Install);
        const dryRun = flags['dry-run'];
        // First pass: use the requested policy directly unless we need to
        // surface conflicts to a human first.
        let onConflict = flags.force
            ? 'overwrite'
            : flags['on-conflict'];
        if (shouldPromptForPolicy({
            dryRun,
            force: flags.force,
            onConflict: flags['on-conflict'],
            isTTY: Boolean(process.stdout.isTTY),
        })) {
            // Run a cheap dry-run first so we know whether to prompt at all.
            const preview = await new InstallService().installMergeDriver({
                dryRun: true,
            });
            const conflicts = preview.plan.actions.flatMap(a => a.kind === 'conflict'
                ? [{ pattern: a.pattern, existingDriver: a.existingDriver }]
                : []);
            if (conflicts.length > 0) {
                onConflict = await this.promptPolicy(conflicts);
            }
        }
        let outcome;
        try {
            outcome = await new InstallService().installMergeDriver({
                dryRun,
                onConflict,
            });
        }
        catch (error) {
            if (error instanceof InstallConflictError) {
                // `this.error` throws a CLIError internally — the outer catch
                // never re-enters. Any other error type propagates naturally.
                this.error(error.message, { exit: 2 });
            }
            throw error;
        }
        if (dryRun) {
            this.log(formatInstallDryRunReport(outcome));
            return;
        }
        // Surface diagnostic warnings to the user after a successful
        // install. These don't alter installation state — they're cues
        // that the driver may not fire until the user takes action.
        for (const w of outcome.plan.textAttributeWarnings) {
            this.warn(`${w.pattern} is marked \`-text\` (binary) on line ${w.lineIndex + 1} of .git/info/attributes. Git does not invoke merge drivers on binary files; the merge driver will be installed but inactive for this glob until you remove \`-text\`.`);
        }
        for (const w of outcome.plan.commentedOutWarnings) {
            this.warn(`${w.pattern} has a commented-out driver rule on line ${w.lineIndex + 1} of .git/info/attributes. The live rule has been added below it — consider removing the commented line to avoid confusion.`);
        }
        Logger.info('Merge driver installed successfully');
    }
}
__decorate([
    log('Install')
], Install.prototype, "run", null);
//# sourceMappingURL=install.js.map