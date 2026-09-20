"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoSphereThemeProvider = GeoSphereThemeProvider;
exports.useGeoSphereUIContext = useGeoSphereUIContext;
exports.useGeoSphereTheme = useGeoSphereTheme;
exports.useGeoSphereBranding = useGeoSphereBranding;
exports.useGeoSphereDensity = useGeoSphereDensity;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * GeoSphere React Integration Boundary & Context Providers
 * Fully compatible with React 19, Next.js 16 App Router, and SSR
 */
const react_1 = require("react");
const configuration_api_js_1 = require("./configuration-api.js");
const GeoSphereUIContext = (0, react_1.createContext)(null);
function GeoSphereThemeProvider({ children, initialMode, initialVisualStyle, initialDensity, initialBranding }) {
    (0, react_1.useEffect)(() => {
        configuration_api_js_1.GeoSphereUI.configure({
            mode: initialMode,
            visualStyle: initialVisualStyle,
            density: initialDensity,
            branding: initialBranding
        });
    }, [initialMode, initialVisualStyle, initialDensity, initialBranding]);
    const [themeState, setThemeState] = (0, react_1.useState)(() => configuration_api_js_1.GeoSphereUI.getTheme());
    const [tokensState, setTokensState] = (0, react_1.useState)(() => configuration_api_js_1.GeoSphereUI.getTheme().tokens);
    const [brandingState, setBrandingState] = (0, react_1.useState)(() => configuration_api_js_1.GeoSphereUI.getBranding());
    const [densityState, setDensityState] = (0, react_1.useState)(() => configuration_api_js_1.GeoSphereUI.getDensity());
    (0, react_1.useEffect)(() => {
        const unsubTheme = configuration_api_js_1.GeoSphereUI.getThemeEngine().subscribe((contract, tokens) => {
            setThemeState(contract);
            setTokensState(tokens);
        });
        const unsubBranding = configuration_api_js_1.GeoSphereUI.getBrandingEngine().subscribe((branding) => {
            setBrandingState(branding);
        });
        return () => {
            unsubTheme();
            unsubBranding();
        };
    }, []);
    const setMode = (mode) => {
        configuration_api_js_1.GeoSphereUI.setTheme(mode);
    };
    const setVisualStyle = (preset) => {
        configuration_api_js_1.GeoSphereUI.setVisualStyle(preset);
    };
    const setDensity = (density) => {
        configuration_api_js_1.GeoSphereUI.setDensity(density);
        setDensityState(density);
    };
    const setBranding = (branding) => {
        configuration_api_js_1.GeoSphereUI.setBranding(branding);
    };
    return ((0, jsx_runtime_1.jsx)(GeoSphereUIContext.Provider, { value: {
            theme: themeState,
            tokens: tokensState,
            branding: brandingState,
            density: densityState,
            setMode,
            setVisualStyle,
            setDensity,
            setBranding
        }, children: children }));
}
function useGeoSphereUIContext() {
    const ctx = (0, react_1.useContext)(GeoSphereUIContext);
    if (!ctx) {
        throw new Error("useGeoSphereUIContext must be used within a <GeoSphereThemeProvider>.");
    }
    return ctx;
}
function useGeoSphereTheme() {
    const { theme, tokens, setMode, setVisualStyle } = useGeoSphereUIContext();
    return { theme, tokens, setMode, setVisualStyle };
}
function useGeoSphereBranding() {
    const { branding, setBranding } = useGeoSphereUIContext();
    return { branding, setBranding };
}
function useGeoSphereDensity() {
    const { density, setDensity } = useGeoSphereUIContext();
    return { density, setDensity };
}
//# sourceMappingURL=react-boundary.js.map