export function assertServerOnly(moduleName: string) {
  if (typeof window !== "undefined") {
    throw new Error(`${moduleName} должен использоваться только на сервере`);
  }
}

export function requireServerEnv(name: string): string {
  assertServerOnly("env");
  const value = process.env[name];
  if (!value) {
    throw new Error(`Отсутствует переменная окружения: ${name}`);
  }
  return value;
}

export function getOptionalServerEnv(name: string, fallback: string = ""): string {
  assertServerOnly("env");
  return process.env[name] ?? fallback;
}


