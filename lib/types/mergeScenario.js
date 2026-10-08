/**
 * Enum representing different merge scenarios based on content presence.
 * Uses bitmask encoding:
 * - Bit 0 (1): Other content present
 * - Bit 1 (2): Local content present
 * - Bit 2 (4): Ancestor content present
 */
export var MergeScenario;
(function (MergeScenario) {
    MergeScenario[MergeScenario["NONE"] = 0] = "NONE";
    MergeScenario[MergeScenario["OTHER_ONLY"] = 1] = "OTHER_ONLY";
    MergeScenario[MergeScenario["LOCAL_ONLY"] = 2] = "LOCAL_ONLY";
    MergeScenario[MergeScenario["LOCAL_AND_OTHER"] = 3] = "LOCAL_AND_OTHER";
    MergeScenario[MergeScenario["ANCESTOR_ONLY"] = 4] = "ANCESTOR_ONLY";
    MergeScenario[MergeScenario["ANCESTOR_AND_OTHER"] = 5] = "ANCESTOR_AND_OTHER";
    MergeScenario[MergeScenario["ANCESTOR_AND_LOCAL"] = 6] = "ANCESTOR_AND_LOCAL";
    MergeScenario[MergeScenario["ALL"] = 7] = "ALL";
})(MergeScenario || (MergeScenario = {}));
//# sourceMappingURL=mergeScenario.js.map