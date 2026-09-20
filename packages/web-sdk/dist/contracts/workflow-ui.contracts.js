/**
 * GeoSphere Workflow SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */
export const WORKFLOW_UI_COMPONENTS = {
    WORKFLOW_TIMELINE: {
        id: "workflows.workflow-timeline",
        name: "Workflow State Transition Timeline",
        version: "1.0.0",
        moduleId: "workflows",
        description: "Visual timeline component rendering workflow state transitions and audit logs",
        inputs: [
            { name: "history", type: "GeoSphereWorkflowHistory[]", required: true, description: "History records" }
        ],
        outputs: ["onSelectStep"],
        events: ["workflows.transitioned"],
        requiredPermissions: ["workflows.read"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "WorkflowTimeline", framework: "react" },
            { platform: "android", componentSymbol: "WorkflowTimeline", framework: "compose" },
            { platform: "ios", componentSymbol: "WorkflowTimeline", framework: "swiftui" }
        ]
    },
    APPROVAL_CARD: {
        id: "workflows.approval-card",
        name: "Approval Decision Card Component",
        version: "1.0.0",
        moduleId: "workflows",
        description: "Card component allowing eligible approvers to approve or reject state transitions",
        inputs: [
            { name: "approval", type: "GeoSphereWorkflowApproval", required: true, description: "Approval payload" }
        ],
        outputs: ["onApprove", "onReject"],
        events: ["workflows.approvalSubmitted"],
        requiredPermissions: ["workflows.approve"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "ApprovalCard", framework: "react" },
            { platform: "android", componentSymbol: "ApprovalCard", framework: "compose" },
            { platform: "ios", componentSymbol: "ApprovalCard", framework: "swiftui" }
        ]
    }
};
export const WORKFLOW_READY_MADE_SCREENS = {
    WORKFLOW_EXECUTION_SCREEN: {
        id: "workflows.execution-screen",
        title: "Workflow Execution Studio Screen",
        version: "1.0.0",
        moduleId: "workflows",
        description: "Main workflow execution screen displaying timeline, valid state transitions, and controls",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["WORKFLOW_EXECUTION", "STATE_TRANSITIONS", "AUDIT_HISTORY"],
        requiredPermissions: ["workflows.execute"],
        containedComponents: ["workflows.workflow-timeline", "workflows.approval-card"],
        adapters: [
            { platform: "web", componentSymbol: "WorkflowExecutionScreen", framework: "react" },
            { platform: "android", componentSymbol: "WorkflowExecutionScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "WorkflowExecutionScreen", framework: "swiftui" }
        ]
    },
    APPROVAL_LIST_SCREEN: {
        id: "workflows.approval-list-screen",
        title: "Pending Approvals Screen",
        version: "1.0.0",
        moduleId: "workflows",
        description: "Screen displaying pending approval requests assigned to the current user or role",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["APPROVALS"],
        requiredPermissions: ["workflows.approve"],
        containedComponents: ["workflows.approval-card"],
        adapters: [
            { platform: "web", componentSymbol: "ApprovalListScreen", framework: "react" },
            { platform: "android", componentSymbol: "ApprovalListScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "ApprovalListScreen", framework: "swiftui" }
        ]
    }
};
//# sourceMappingURL=workflow-ui.contracts.js.map