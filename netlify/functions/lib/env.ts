export function getEnv(key: string) {
  const v = process.env[key];
  if (!v || v.trim().length === 0) return undefined;
  return v;
}

export function requireEnv(key: string) {
  const v = getEnv(key);
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

