// Pruebas de RED-09: node --require @swc-node/register --test libraries/helpers/src/subdomain/subdomain.management.spec.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { getCookieUrlFromDomain, getLegacyCookieDomain } from './subdomain.management';

test('la cookie de sesión es solo de la dirección de Redes, no de todo dimeloweb.com', () => {
  // antes: '.dimeloweb.com' → la cookie viajaba a admin., n8n., studio. y a cualquier web de cliente en el dominio
  assert.equal(getCookieUrlFromDomain('https://redes.dimeloweb.com'), undefined);
});

test('la del dominio viejo se sigue pudiendo borrar', () => {
  assert.equal(getLegacyCookieDomain('https://redes.dimeloweb.com'), '.dimeloweb.com');
});
