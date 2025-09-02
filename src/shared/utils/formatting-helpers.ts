import { enUS, es } from 'date-fns/locale';

export function concatStrings(...params: Array<any>): string {
  return params.filter(Boolean).join(' ');
}
export function getLocale(language: string) {
  switch (language) {
    case 'en':
      return { locale: enUS };
    default:
      return { locale: es };
  }
}
