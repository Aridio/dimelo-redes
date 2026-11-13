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

// RR-01: la cookie del state de la entrada. Con https lleva el prefijo __Host-: el navegador solo la acepta sin Domain,
// con Secure y Path=/, puesta por esta misma dirección. Así una oauth_state de .dimeloweb.com (la que dejaba dw21 diez
// minutos, o la que ponga otra web del dominio) nunca se lee en su lugar. Sin https (NOT_SECURED) el prefijo no vale.
export function getOauthStateCookieName(): string {
  return process.env.NOT_SECURED ? 'oauth_state' : '__Host-oauth_state';
}

// RR-04: cuántas cookies con ese nombre trae la cabecera Cookie. El navegador manda todas (la de esta dirección y la de
// todo el dominio) sin decir de dónde es cada una, y cookie-parser se queda con la primera, que suele ser la más vieja.
export function countCookie(header: string | undefined, name: string): number {
  return String(header || '')
    .split(';')
    .filter((part) => part.split('=')[0].trim() === name).length;
}
