import { __decorate } from "tslib";
import { Messages } from '@salesforce/core';
import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { PLUGIN_NAME } from '../../../../constant/pluginConstant.js';
import { formatUninstallDryRunReport } from '../../../../service/InstallReports.js';
import { UninstallService } from '../../../../service/UninstallService.js';
import { log } from '../../../../utils/LoggingDecorator.js';
import { Logger } from '../../../../utils/LoggingService.js';
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages(PLUGIN_NAME, 'uninstall');
export default class Uninstall extends SfCommand {
    static summary = messages.getMessage('summary');
    static description = messages.getMessage('description');
    static examples = messages.getMessages('examples');
    static aliases = [
        'git:merge:driver:disable',
    ];
    static flags = {
        'dry-run': Flags.boolean({
            summary: messages.getMessage('flags.dry-run.summary'),
            default: false,
        }),
    };
    async run() {
        const { flags } = await this.parse(Uninstall);
        const dryRun = flags['dry-run'];
        const outcome = await new UninstallService().uninstallMergeDriver({
            dryRun,
        });
        if (dryRun) {
            this.log(formatUninstallDryRunReport(outcome));
            return;
        }
        Logger.info('Merge driver uninstalled successfully');
    }
}
__decorate([
    log('Uninstall')
], Uninstall.prototype, "run", null);
//# sourceMappingURL=uninstall.js.map