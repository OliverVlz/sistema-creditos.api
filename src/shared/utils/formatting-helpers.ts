export function concatStrings(...params: Array<any>): string {
  return params.filter(Boolean).join(' ');
}
