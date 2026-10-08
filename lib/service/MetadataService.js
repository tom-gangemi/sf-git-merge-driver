export class MetadataService {
    static getKeyFieldExtractor(metadataType) {
        // `in` walks the prototype chain, so `'__proto__' in {}` is true —
        // metadataType is an untrusted XML tag name, and `__proto__` would
        // resolve to the inherited Object.prototype accessor instead of
        // undefined. Object.hasOwn checks own properties only.
        return Object.hasOwn(METADATA_KEY_EXTRACTORS, metadataType)
            ? METADATA_KEY_EXTRACTORS[metadataType]
            : undefined;
    }
    static isOrderedAttribute(attribute) {
        return ORDERED_ATTRIBUTES.has(attribute);
    }
    // MergeNodeFactory's own array-shape check (isStringArray) only sees an
    // attribute as a text array when the parser already produced 2+
    // occurrences on at least one side; an attribute with exactly one
    // occurrence on all three sides unboxes to a bare scalar and would
    // otherwise fall back to strict TextMergeNode comparison. Tags listed
    // here always get the set-union TextArrayMergeNode treatment regardless
    // of incidental cardinality, so the same edit produces the same outcome
    // whether the list currently has one entry or several.
    static isTextArrayAttribute(attribute) {
        return TEXT_ARRAY_ATTRIBUTES.has(attribute);
    }
}
const ORDERED_ATTRIBUTES = new Set([
    'customValue', // GlobalValueSet, Picklist CustomField
    'standardValue', // StandardValueSet
    'value', // Picklist CustomField
    'values', // RecordType
    'filterItems', // CustomField
    'summaryFilterItems', // CustomField
    'criteriaItems', // SharingRules, Workflow, AssignmentRules, AutoResponseRules, EscalationRules
    'prompts', // Translations
    'promptVersions', // Translations
]);
const TEXT_ARRAY_ATTRIBUTES = new Set([
    'members', // Package, DestructiveChanges — manifest member list
]);
// An object-shaped key field (element with attributes/children, built on
// Object.create(null) by the parser) has no inherited toString and would
// throw on String(). Every extractor already treats String(undefined) as
// "absent" — yield that same sentinel here so an unusable key field is
// filtered out instead of crashing.
const getPropertyValue = (el, property) => {
    const value = el[property];
    return typeof value === 'object' && value !== null
        ? String(undefined)
        : String(value);
};
const getFilterItemKey = (el) => {
    const field = getPropertyValue(el, 'field');
    const operation = getPropertyValue(el, 'operation');
    const value = getPropertyValue(el, 'value');
    const valueField = getPropertyValue(el, 'valueField');
    return [field, operation, value, valueField]
        .filter(x => x !== String(undefined))
        .join('.');
};
// The `picklistValues` element name is reused across two metadata
// schemas with different key fields:
//   - CustomObjectTranslation.fields[].picklistValues → keyed by `masterLabel`
//   - RecordType.picklistValues                       → keyed by `picklist`
// Without the fallback, every RecordType `<picklistValues>` block
// keys to the literal string `"undefined"` (since `masterLabel`
// doesn't exist on that schema), `buildKeyedMap` retains only the
// last block, and the merge silently drops the rest.
const getPicklistValuesKey = (el) => {
    const masterLabel = getPropertyValue(el, 'masterLabel');
    return masterLabel !== String(undefined)
        ? masterLabel
        : getPropertyValue(el, 'picklist');
};
const METADATA_KEY_EXTRACTORS = {
    labels: (el) => getPropertyValue(el, 'fullName'), // CustomLabels
    applicationVisibilities: (el) => getPropertyValue(el, 'application'), // Profile // PermissionSet
    categoryGroupVisibilities: (el) => getPropertyValue(el, 'dataCategoryGroup'), // Profile
    classAccesses: (el) => getPropertyValue(el, 'apexClass'), // Profile // PermissionSet
    customMetadataTypeAccesses: (el) => getPropertyValue(el, 'name'), // Profile // PermissionSet
    customPermissions: (el) => getPropertyValue(el, 'name'), // Profile // PermissionSet // PermissionSetLicenseDefinition
    customSettingAccesses: (el) => getPropertyValue(el, 'name'), // Profile // PermissionSet
    externalDataSourceAccesses: (el) => getPropertyValue(el, 'externalDataSource'), // Profile // PermissionSet
    fieldPermissions: (el) => getPropertyValue(el, 'field'), // Profile // PermissionSet
    flowAccesses: (el) => getPropertyValue(el, 'flow'), // Profile // PermissionSet
    layoutAssignments: (el) => {
        const layout = getPropertyValue(el, 'layout');
        const recordType = getPropertyValue(el, 'recordType');
        return [layout, recordType].filter(x => x !== String(undefined)).join('.');
    }, // Profile
    loginFlows: (el) => getPropertyValue(el, 'friendlyname'), // Profile
    loginHours: (el) => typeof el === 'object' && el !== null ? Object.keys(el).join(',') : '', // Profile
    loginIpRanges: (el) => {
        const startAddress = getPropertyValue(el, 'startAddress');
        const endAddress = getPropertyValue(el, 'endAddress');
        return `${startAddress}-${endAddress}`;
    }, // Profile
    objectPermissions: (el) => getPropertyValue(el, 'object'), // Profile // PermissionSet
    pageAccesses: (el) => getPropertyValue(el, 'apexPage'), // Profile // PermissionSet
    profileActionOverrides: (el) => getPropertyValue(el, 'actionName'), // Profile
    recordTypeVisibilities: (el) => getPropertyValue(el, 'recordType'), // Profile // PermissionSet
    servicePresenceStatusAccesses: (el) => getPropertyValue(el, 'servicePresenceStatus'), // Profile // PermissionSet
    tabVisibilities: (el) => getPropertyValue(el, 'tab'), // Profile // PermissionSet
    userPermissions: (el) => getPropertyValue(el, 'name'), // Profile // PermissionSet
    dataspaceScopes: (el) => getPropertyValue(el, 'dataspaceScope'), // PermissionSet
    emailRoutingAddressAccesses: (el) => getPropertyValue(el, 'name'), // PermissionSet
    externalCredentialPrincipalAccesses: (el) => getPropertyValue(el, 'externalCredentialPrincipal'), // PermissionSet
    tabSettings: (el) => getPropertyValue(el, 'tab'), // PermissionSet
    sharingCriteriaRules: (el) => getPropertyValue(el, 'fullName'), // SharingRules
    sharingGuestRules: (el) => getPropertyValue(el, 'fullName'), // SharingRules
    sharingOwnerRules: (el) => getPropertyValue(el, 'fullName'), // SharingRules
    sharingTerritoryRules: (el) => getPropertyValue(el, 'fullName'), // SharingRules
    criteriaItems: getFilterItemKey, // SharingRules // AssignmentRules // AutoResponseRules // EscalationRules
    filterItems: getFilterItemKey, // CustomField
    summaryFilterItems: getFilterItemKey, // CustomField
    valueSettings: (el) => getPropertyValue(el, 'valueName'), // CustomField
    // sharedTo: it should be a complete pure object compare and not an array comparison // SharingRules
    // accountSettings: it should be a complete pure object compare and not an array comparison // SharingRules
    alerts: (el) => getPropertyValue(el, 'fullName'), // Workflow
    recipients: (el) => getPropertyValue(el, 'type'), // Workflow
    fieldUpdates: (el) => getPropertyValue(el, 'fullName'), // Workflow
    flowActions: (el) => getPropertyValue(el, 'fullName'), // Workflow
    flowInputs: (el) => getPropertyValue(el, 'name'), // Workflow
    flowAutomation: (el) => getPropertyValue(el, 'fullName'), // Workflow
    knowledgePublishes: (el) => getPropertyValue(el, 'fullName'), // Workflow
    outboundMessages: (el) => getPropertyValue(el, 'fullName'), // Workflow
    rules: (el) => getPropertyValue(el, 'fullName'), // Workflow
    actions: (el) => getPropertyValue(el, 'name'), // Workflow
    //workflowTimeTriggers: it should be a complete pure object compare and not an array comparison // Workflow
    send: (el) => getPropertyValue(el, 'fullName'), // Workflow
    tasks: (el) => getPropertyValue(el, 'fullName'), // Workflow
    assignmentRule: (el) => getPropertyValue(el, 'fullName'), // AssignmentRules
    //ruleEntry: it should be a complete pure object compare and not an array comparison // AssignmentRules // AutoResponseRules // EscalationRules
    autoResponseRule: (el) => getPropertyValue(el, 'fullName'), // AutoResponseRules
    escalationRule: (el) => getPropertyValue(el, 'fullName'), // EscalationRules
    marketingAppExtActions: (el) => getPropertyValue(el, 'apiName'), // MarketingAppExtension
    marketingAppExtActivities: (el) => getPropertyValue(el, 'fullName'), // MarketingAppExtension
    matchingRules: (el) => getPropertyValue(el, 'fullName'), // MatchingRules
    matchingRuleItems: (el) => {
        const fieldName = getPropertyValue(el, 'fieldName');
        const matchingMethod = getPropertyValue(el, 'matchingMethod');
        return `${fieldName}-${matchingMethod}`;
    }, // MatchingRules
    customValue: (el) => getPropertyValue(el, 'fullName'), // GlobalValueSet
    standardValue: (el) => getPropertyValue(el, 'fullName'), // StandardValueSet
    valueTranslation: (el) => getPropertyValue(el, 'masterLabel'), // GlobalValueSetTranslation // StandardValueSetTranslation
    botBlocks: (el) => getPropertyValue(el, 'fullName'), // Translations
    botBlockVersions: (el) => getPropertyValue(el, 'fullName'), // Translations
    botDialogs: (el) => getPropertyValue(el, 'developerName'), // Translations
    botSteps: (el) => getPropertyValue(el, 'stepIdentifier'), // Translations
    botMessages: (el) => getPropertyValue(el, 'messageIdentifier'), // Translations
    botVariableOperation: (el) => getPropertyValue(el, 'variableOperationIdentifier'), // Translations
    botTemplates: (el) => getPropertyValue(el, 'fullName'), // Translations
    bots: (el) => getPropertyValue(el, 'fullName'), // Translations
    botVersions: (el) => getPropertyValue(el, 'fullName'), // Translations
    conversationMessageDefinitions: (el) => getPropertyValue(el, 'name'), // Translations
    constantValueTranslations: (el) => getPropertyValue(el, 'name'), // Translations
    customApplications: (el) => getPropertyValue(el, 'name'), // Translations
    customLabels: (el) => getPropertyValue(el, 'name'), // Translations
    customPageWebLinks: (el) => getPropertyValue(el, 'name'), // Translations
    customTabs: (el) => getPropertyValue(el, 'name'), // Translations
    desFieldTemplateMessages: (el) => getPropertyValue(el, 'name'), // Translations
    flowDefinitions: (el) => getPropertyValue(el, 'fullName'), // Translations
    flows: (el) => getPropertyValue(el, 'fullName'), // Translations
    identityVerificationCustomFieldLabels: (el) => getPropertyValue(el, 'name'), // Translations
    pipelineInspMetricConfigs: (el) => getPropertyValue(el, 'name'), // Translations
    prompts: (el) => getPropertyValue(el, 'name'), // Translations
    promptVersions: (el) => getPropertyValue(el, 'name'), // Translations
    quickActions: (el) => getPropertyValue(el, 'name'), // Translations
    reportTypes: (el) => getPropertyValue(el, 'name'), // Translations
    sections: (el) => {
        const name = getPropertyValue(el, 'name'); // Translations
        const section = getPropertyValue(el, 'section'); // CustomObjectTranslation
        return [name, section].filter(x => x !== String(undefined))[0];
    }, // Special thing because of types different// Translations // CustomObjectTranslation
    columns: (el) => getPropertyValue(el, 'name'), // Translations
    scontrols: (el) => getPropertyValue(el, 'name'), // Translations
    caseValues: (el) => {
        const article = getPropertyValue(el, 'article');
        const caseType = getPropertyValue(el, 'caseType');
        const plural = getPropertyValue(el, 'plural');
        const possessive = getPropertyValue(el, 'possessive');
        return [article, caseType, plural, possessive]
            .filter(x => x !== String(undefined))
            .join('.');
    }, // CustomObjectTranslation
    fieldSets: (el) => getPropertyValue(el, 'name'), // CustomObjectTranslation
    fields: (el) => getPropertyValue(el, 'name'), // CustomObjectTranslation
    picklistValues: getPicklistValuesKey, // CustomObjectTranslation (masterLabel) | RecordType (picklist)
    values: (el) => getPropertyValue(el, 'fullName'), // RecordType
    value: (el) => getPropertyValue(el, 'fullName'), // CustomField
    layouts: (el) => getPropertyValue(el, 'layout'), // CustomObjectTranslation
    quickActionParametersTranslation: (el) => getPropertyValue(el, 'name'), // CustomObjectTranslation
    recordTypes: (el) => getPropertyValue(el, 'name'), // CustomObjectTranslation
    sharingReasons: (el) => getPropertyValue(el, 'name'), // CustomObjectTranslation
    standardFields: (el) => getPropertyValue(el, 'name'), // CustomObjectTranslation
    validationRules: (el) => getPropertyValue(el, 'name'), // CustomObjectTranslation
    webLinks: (el) => getPropertyValue(el, 'name'), // CustomObjectTranslation
    workflowTasks: (el) => getPropertyValue(el, 'name'), // CustomObjectTranslation
    // Package.xml (manifest file)
    types: (el) => getPropertyValue(el, 'name'), // Package - types keyed by metadata type name
};
//# sourceMappingURL=MetadataService.js.map