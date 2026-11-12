// Pruebas de RED-08 (sin Nest ni base): node --test --experimental-strip-types apps/backend/src/dimelo/oculto.spec.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { cerrarOculto, rutaOculta } from './oculto.ts';

test('lo oculto se cierra también en el servidor, con cualquier forma de escribir la ruta', () => {
  for (const ruta of [
    '/webhooks', '/webhooks/', '/webhooks/send', '/WEBHOOKS', '//webhooks', '/%77ebhooks', '/webhooks?x=1',
    '/user/oauth-app', '/user/oauth-app/rotate-secret', '/user//oauth-app', '/user/approved-apps/abc',
    '/oauth/authorize', '/oauth/token', '/OAuth/userinfo', '/enterprise/create-user',
    '/user/api-key/rotate', '/public/modify-subscription', '/public/agent', '/integrations/extension-refresh',
    '/mcp', '/mcp/abc', '/mcp-oauth-claude/x', '/.well-known/oauth-protected-resource/mcp',
    '/.well-known/oauth-authorization-server', '/%E0%A4%A', null,
  ]) {
    assert.equal(rutaOculta(ruta), true, String(ruta));
  }
});

test('lo que se ve y lo que usa el panel sigue abierto', () => {
  for (const ruta of [
    '/user/self', '/user/organizations', '/posts', '/posts/abc', '/integrations/list', '/integrations/social/x',
    '/integrations/social-connect/x', '/media', '/auth/oauth/GENERIC/exists', '/auth/oauth/GENERIC',
    '/public/posts/abc', '/public/stream', '/public/v1/posts', '/public/v1/upload-from-url', '/public/v1/integrations',
    '/dimelo/clave-espacio', '/copilot/chat', '/billing', '/autopost', '/webhooksx', '/oauthx', '/mcpx',
  ]) {
    assert.equal(rutaOculta(ruta), false, ruta);
  }
});

test('responde 404 y no sigue', () => {
  let estado = 0;
  let siguio = false;
  const res = { status: (n: number) => { estado = n; return { json: () => undefined }; } };
  cerrarOculto({ path: '/webhooks' }, res, () => { siguio = true; });
  assert.equal(estado, 404);
  assert.equal(siguio, false);
  cerrarOculto({ path: '/posts' }, res, () => { siguio = true; });
  assert.equal(siguio, true);
});
