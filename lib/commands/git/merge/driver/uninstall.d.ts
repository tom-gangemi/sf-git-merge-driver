import { SfCommand } from '@salesforce/sf-plugins-core';
export default class Uninstall extends SfCommand<void> {
    static readonly summary: string;
    static readonly description: string;
    static readonly examples: string[];
    static readonly aliases: string[];
    static readonly flags: {
        'dry-run': import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
