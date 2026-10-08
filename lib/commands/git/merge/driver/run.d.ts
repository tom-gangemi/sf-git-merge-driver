import { SfCommand } from '@salesforce/sf-plugins-core';
export default class Run extends SfCommand<void> {
    static readonly summary: string;
    static readonly description: string;
    static readonly examples: string[];
    static readonly state = "deprecated";
    static readonly deprecationOptions: {
        version: string;
        to: string;
    };
    static readonly flags: {
        'ancestor-file': import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        'local-file': import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        'other-file': import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        'output-file': import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        'conflict-marker-size': import("@oclif/core/interfaces").OptionFlag<number, import("@oclif/core/interfaces").CustomOptions>;
        'ancestor-conflict-tag': import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        'local-conflict-tag': import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        'other-conflict-tag': import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
    };
    run(): Promise<void>;
}
