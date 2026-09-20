/**
 * GeoSphere 3-Tier Design Token System & Visual Style Presets
 */
import { DesignTokenContract, ColorTokens, VisualStylePreset, SDKSemanticTokens } from "../contracts/theme.contracts.js";
export declare const GLOBAL_TOKENS: {
    colors: {
        primary: string;
        primaryForeground: string;
        secondary: string;
        secondaryForeground: string;
        background: string;
        surface: string;
        surfaceVariant: string;
        text: string;
        textSecondary: string;
        border: string;
        success: string;
        warning: string;
        error: string;
        info: string;
    };
    typography: {
        fontFamily: string;
        fontFamilyMono: string;
        fontSizeXs: string;
        fontSizeSm: string;
        fontSizeMd: string;
        fontSizeLg: string;
        fontSizeXl: string;
    };
    spacing: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        "2xl": string;
    };
    shape: {
        radiusSmall: string;
        radiusMedium: string;
        radiusLarge: string;
        radiusFull: string;
    };
    elevation: {
        none: string;
        low: string;
        medium: string;
        high: string;
    };
    layout: {
        sidebarWidth: string;
        toolbarHeight: string;
        contentPadding: string;
        panelWidth: string;
    };
};
export declare const VISUAL_STYLE_PRESETS: Record<VisualStylePreset, Partial<DesignTokenContract>>;
export interface ComponentTokens {
    button: {
        primaryBg: string;
        primaryText: string;
        radius: string;
        padding: string;
    };
    card: {
        bg: string;
        border: string;
        radius: string;
        shadow: string;
    };
    input: {
        bg: string;
        border: string;
        text: string;
        radius: string;
    };
}
export declare function resolveComponentTokens(tokens?: DesignTokenContract): ComponentTokens;
export declare function resolveSDKSemanticTokens(colors?: Partial<ColorTokens>): SDKSemanticTokens;
//# sourceMappingURL=tokens.d.ts.map