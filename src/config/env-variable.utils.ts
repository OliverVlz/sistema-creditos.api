export function ensureEnvVar(variableName: string) {
  const value = process.env[variableName];
  if (!value) {
    throw new Error(`Please set "${variableName}" env variable`);
  }
  return value;
}

export function validateNumberEnvVar(
  variableName: string,
  defaultValue?: number,
) {
  const value = parseInt(process.env[variableName] || '', 10) || defaultValue;
  if (Number.isNaN(value)) {
    throw new Error(`Please set a valid "${variableName}" env variable`);
  }
  return value;
}
