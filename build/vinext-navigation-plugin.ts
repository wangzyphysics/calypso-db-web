import type { Plugin } from "vite";

/**
 * Vinext beta.5 + Vite 8 can merge the lazy navigation namespace into the
 * browser entry without preserving its exports. Link then receives undefined
 * navigation/prefetch functions. Preserving entry signatures keeps the dynamic
 * import facades and their APIs intact, only in the production client build.
 * Remove this workaround once an upstream version passes production navigation.
 */
export function vinextNavigationCompatibility(): Plugin {
  return {
    name: "calypso:vinext-navigation-compatibility",
    apply: "build",
    options(options) {
      if (this.environment.name !== "client") return;
      return { ...options, preserveEntrySignatures: "strict" };
    },
  };
}
