import { parse } from 'tldts';

export function getCookieUrlFromDomain(domain: string) {
  const url = parse(domain);
  // Dimelo Redes: la cookie no viaja a otros nombres de dimeloweb.com
  return url.hostname!;
}
