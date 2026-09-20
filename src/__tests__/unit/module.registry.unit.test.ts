import { ModuleRegistry } from "@/core/modules/registry";

export function runModuleRegistryUnitTests() {
  // 1. Core Module Registration
  const gisCore = ModuleRegistry.get("gis-core");
  if (!gisCore || !gisCore.isCoreModule) {
    throw new Error(
      "Module System: GIS Core module must be registered as core module",
    );
  }

  // 2. Default Modules Check
  const modules = ModuleRegistry.getAll();
  if (modules.length < 5) {
    throw new Error(
      "Module System: Expected at least 5 registered platform modules",
    );
  }

  // 3. Module Dependency Satisfaction
  const isSatisfied = ModuleRegistry.areDependenciesSatisfied("fleet", [
    "gis-core",
  ]);
  if (!isSatisfied) {
    throw new Error(
      "Module System: Fleet module dependency 'gis-core' check failed",
    );
  }

  const unsatisfied = ModuleRegistry.areDependenciesSatisfied("fleet", []);
  if (unsatisfied) {
    throw new Error(
      "Module System: Module enabled without satisfied dependencies",
    );
  }

  return true;
}
