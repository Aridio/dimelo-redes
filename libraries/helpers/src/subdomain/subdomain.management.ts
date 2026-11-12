import { parse } from 'tldts';

// Dímelo Redes (RED-09): las cookies de sesión son solo de la dirección de Redes (sin Domain): antes se ponían para
// todo .dimeloweb.com y viajaban a cualquier otra web de ese dominio. undefined = sin atributo Domain.
export function getCookieUrlFromDomain(_domain: string): string | undefined {
  return undefined;
}

// El dominio que se usaba antes (.dimeloweb.com): solo para BORRAR las cookies viejas que aún tenga el navegador. Si
// quedara una, el navegador la mandaría primero y el servidor usaría esa sesión (el caso de dos cookies de dw11).
export function getLegacyCookieDomain(domain: string) {
  const url = parse(domain);
  return url.domain! ? '.' + url.domain! : url.hostname!;
}
