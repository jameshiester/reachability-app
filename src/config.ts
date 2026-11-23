export interface ApplicationConfig {
  readonly enableExport: boolean;
  readonly exportRoot: string;
  readonly internalPort: number;
  readonly publicPort: number;
}

const parseBoolean = (value: string | undefined, name: string): boolean => {
  if (value === undefined || value === "false") {
    return false;
  }
  if (value === "true") {
    return true;
  }
  throw new Error(`${name} must be either "true" or "false"`);
};

const parsePort = (
  value: string | undefined,
  fallback: number,
  name: string,
): number => {
  if (value === undefined || value.length === 0) {
    return fallback;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`${name} must be an integer between 1 and 65535`);
  }
  return port;
};

export const loadConfig = (
  environment: NodeJS.ProcessEnv = process.env,
): ApplicationConfig => ({
  enableExport: parseBoolean(environment.ENABLE_EXPORT, "ENABLE_EXPORT"),
  exportRoot: environment.EXPORT_ROOT ?? "/app/data/exports",
  internalPort: parsePort(
    environment.INTERNAL_PORT,
    8081,
    "INTERNAL_PORT",
  ),
  publicPort: parsePort(environment.PORT, 8080, "PORT"),
});
