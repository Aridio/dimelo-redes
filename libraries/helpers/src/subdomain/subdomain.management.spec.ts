// Pruebas de RED-09: node --require @swc-node/register --test libraries/helpers/src/subdomain/subdomain.management.spec.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  countCookie,
  getCookieUrlFromDomain,
  getLegacyCookieDomain,
  getOauthStateCookieName,
} from './subdomain.management';

test('la cookie de sesión es solo de la dirección de Redes, no de todo dimeloweb.com', () => {
  // antes: '.dimeloweb.com' → la cookie viajaba a admin., n8n., studio. y a cualquier web de cliente en el dominio
  assert.equal(getCookieUrlFromDomain('https://redes.dimeloweb.com'), undefined);
});

test('la del dominio viejo se sigue pudiendo borrar', () => {
  assert.equal(getLegacyCookieDomain('https://redes.dimeloweb.com'), '.dimeloweb.com');
});

test('RR-01: el state de la entrada va en una cookie __Host- (nunca la de .dimeloweb.com que dejaba dw21)', () => {
  const antes = process.env.NOT_SECURED;
  try {
    delete process.env.NOT_SECURED;
    assert.equal(getOauthStateCookieName(), '__Host-oauth_state');
    process.env.NOT_SECURED = 'true';
    assert.equal(getOauthStateCookieName(), 'oauth_state');
  } finally {
    if (antes === undefined) delete process.env.NOT_SECURED;
    else process.env.NOT_SECURED = antes;
  }
});

test('RR-04: se ve cuándo llegan dos cookies con el mismo nombre', () => {
  assert.equal(countCookie('auth=vieja; showorg=x; auth=nueva', 'auth'), 2);
  assert.equal(countCookie('auth=una; oauth_state=x', 'auth'), 1);
  assert.equal(countCookie('dimelo_redes_volver=/media; xauth=1', 'auth'), 0);
  assert.equal(countCookie(undefined, 'auth'), 0);
});
