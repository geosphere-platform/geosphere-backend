/**
 * GeoSphere Centralized Icon Strategy
 */
export interface IconDefinition {
    name: string;
    viewBox?: string;
    svgPath: string;
}
export declare const COMMON_ICONS: Record<string, IconDefinition>;
export declare class GeoSphereIconRegistry {
    private static icons;
    static registerIcon(name: string, definition: IconDefinition): void;
    static getIcon(name: string): IconDefinition | undefined;
    static listIcons(): string[];
}
//# sourceMappingURL=icons.d.ts.map