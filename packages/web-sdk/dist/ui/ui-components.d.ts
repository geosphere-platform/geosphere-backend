/**
 * GeoSphere Web SDK — 14 Reusable GIS UI Components
 *
 * Enterprise-grade UI component controllers for building custom GIS applications.
 */
export declare class GeoSphereMapComponent {
    renderHTML(mapId?: string): string;
}
export declare class GeoSphereLayerManagerComponent {
    renderHTML(layers: Array<{
        id: string;
        name: string;
        visible: boolean;
        opacity?: number;
    }>): string;
}
export declare class GeoSphereBaseMapSelectorComponent {
    renderHTML(activeBasemap: string): string;
}
export declare class GeoSphereJurisdictionSelectorComponent {
    renderHTML(jurisdictions: Array<{
        id: string;
        name: string;
        level: string;
        selected?: boolean;
    }>): string;
}
export declare class GeoSphereMapSearchComponent {
    renderHTML(): string;
}
export declare class GeoSphereFeatureDetailsComponent {
    renderHTML(feature: {
        id: string;
        title: string;
        properties: Record<string, any>;
    }): string;
}
export declare class GeoSphereLegendComponent {
    renderHTML(items: Array<{
        label: string;
        color: string;
    }>): string;
}
export declare class GeoSphereMapControlsComponent {
    renderHTML(): string;
}
export declare class GeoSphereMeasureToolComponent {
    renderHTML(): string;
}
export declare class GeoSphereDrawToolComponent {
    renderHTML(): string;
}
export declare class GeoSphereEditToolComponent {
    renderHTML(): string;
}
export declare class GeoSphereSelectionToolComponent {
    renderHTML(): string;
}
export declare class GeoSphereMapStyleEditorComponent {
    renderHTML(): string;
}
export declare class GeoSphereMapSettingsComponent {
    renderHTML(): string;
}
//# sourceMappingURL=ui-components.d.ts.map