/**
 * GeoSphere Rules SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */
export const RULES_UI_COMPONENTS = {
    RULE_CONDITION_BUILDER: {
        id: "rules.condition-builder",
        name: "Rule Condition Group Builder Component",
        version: "1.0.0",
        moduleId: "rules",
        description: "Visual condition group builder supporting nested ALL/ANY/NONE combinators and typed operators",
        inputs: [
            { name: "group", type: "GeoSphereRuleGroup", required: true, description: "Root condition group" }
        ],
        outputs: ["onChange"],
        events: ["rules.statusChanged"],
        requiredPermissions: ["rules.read"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "RuleConditionBuilder", framework: "react" },
            { platform: "android", componentSymbol: "RuleConditionBuilder", framework: "compose" },
            { platform: "ios", componentSymbol: "RuleConditionBuilder", framework: "swiftui" }
        ]
    },
    RULE_SIMULATION_RESULT: {
        id: "rules.simulation-result",
        name: "Rule Simulation & Evaluation Result Component",
        version: "1.0.0",
        moduleId: "rules",
        description: "Visual inspector for rule evaluation output, matched rules, actions, and violations",
        inputs: [
            { name: "result", type: "GeoSphereRuleResult", required: true, description: "Rule evaluation result struct" }
        ],
        outputs: ["onRetrySimulation"],
        events: ["rules.ruleCreated"],
        requiredPermissions: ["rules.read"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "RuleSimulationResult", framework: "react" },
            { platform: "android", componentSymbol: "RuleSimulationResult", framework: "compose" },
            { platform: "ios", componentSymbol: "RuleSimulationResult", framework: "swiftui" }
        ]
    }
};
export const RULES_READY_MADE_SCREENS = {
    RULE_LIST_SCREEN: {
        id: "rules.list-screen",
        title: "Rule Directory Screen",
        version: "1.0.0",
        moduleId: "rules",
        description: "Full-screen rule directory with scope tabs, status filters, and search bar",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["RULE_EVALUATION", "POLICY_ENFORCEMENT"],
        requiredPermissions: ["rules.read"],
        containedComponents: ["rules.condition-builder"],
        adapters: [
            { platform: "web", componentSymbol: "RuleListScreen", framework: "react" },
            { platform: "android", componentSymbol: "RuleListScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "RuleListScreen", framework: "swiftui" }
        ]
    },
    RULE_SIMULATION_SCREEN: {
        id: "rules.simulation-screen",
        title: "Rule Simulation Inspector Screen",
        version: "1.0.0",
        moduleId: "rules",
        description: "Full-screen rule simulator allowing test context creation without mutating production state",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["SIMULATION_ENGINE"],
        requiredPermissions: ["rules.simulate"],
        containedComponents: ["rules.simulation-result"],
        adapters: [
            { platform: "web", componentSymbol: "RuleSimulationScreen", framework: "react" },
            { platform: "android", componentSymbol: "RuleSimulationScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "RuleSimulationScreen", framework: "swiftui" }
        ]
    }
};
//# sourceMappingURL=rules-ui.contracts.js.map