export const IS_DEV = import.meta.env.DEV;

export const logger = {
  log(scope: string, ...args: unknown[]): void {
    if (!IS_DEV) return;
    console.log(`[LinkAI:${scope}]`, ...args);
  },
  warn(scope: string, ...args: unknown[]): void {
    if (!IS_DEV) return;
    console.warn(`[LinkAI:${scope}]`, ...args);
  },
  error(scope: string, ...args: unknown[]): void {
    console.error(`[LinkAI:${scope}]`, ...args);
  },
};
