// utils/logger.ts

// Read enabled namespaces from env (comma-separated, e.g. "background,github")
const enabledNamespaces = (import.meta.env.VITE_VERBOSE_NAMESPACES || "")
  .split(",")
  .map((ns: string) => ns.trim())
  .filter(Boolean);

// Fallback: if VITE_VERBOSE=true and no namespaces set, enable all debug logs
const globalVerbose = import.meta.env.VITE_VERBOSE === "true";

export function createLogger(namespace: string) {
  const isDebugEnabled = globalVerbose || enabledNamespaces.includes(namespace);

  return {
    debug: (...args: any[]) => {
      if (isDebugEnabled) {
        console.log(`[${namespace}]`, ...args);
      }
    },
    warn: (...args: any[]) => {
      console.warn(`[${namespace}]`, ...args);
    },
    error: (...args: any[]) => {
      console.error(`[${namespace}]`, ...args);
    },
  };
}

// Optional: keep a default export for gradual migration (not recommended for new code)
// export const logger = createLogger('default');
