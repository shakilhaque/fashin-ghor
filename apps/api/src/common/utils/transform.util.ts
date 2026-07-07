export function emptyStringToUndefined({ value }: { value: unknown }): unknown {
  return value === '' ? undefined : value;
}
