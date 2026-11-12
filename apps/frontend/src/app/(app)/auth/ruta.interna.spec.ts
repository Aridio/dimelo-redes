// Pruebas de RED-03 (sin Next): node --test --experimental-strip-types 'apps/frontend/src/app/(app)/auth/ruta.interna.spec.ts'
import assert from 'node:assert/strict';
import test from 'node:test';
import { rutaInterna } from './ruta.interna.ts';

const ORIGEN = 'https://redes.dimeloweb.com';

test('vuelve solo a rutas de este sitio', () => {
  assert.equal(rutaInterna('/launches', ORIGEN), '/launches');
  assert.equal(rutaInterna('/oauth/authorize?client_id=a&state=b#x', ORIGEN), '/oauth/authorize?client_id=a&state=b#x');
  // La pantalla de autorizar pasa la dirección completa: se acepta solo la de este sitio, convertida en ruta
  assert.equal(rutaInterna('https://redes.dimeloweb.com/oauth/authorize?x=1', ORIGEN), '/oauth/authorize?x=1');
});

test('nunca otro sitio, esquema raro ni trucos de barras', () => {
  for (const malo of [
    'javascript:alert(1)//http',
    'JaVaScRiPt:alert(document.cookie)',
    ' javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'https://otro.example/launches',
    'http://redes.dimeloweb.com/launches',
    'https://redes.dimeloweb.com.otro.example/',
    'https://redes.dimeloweb.com@otro.example/',
    '//otro.example/launches',
    '/\\otro.example',
    '\\\\otro.example',
    '/\t/otro.example',
    '/\n/otro.example',
    'launches',
    '',
    null,
    undefined,
    42,
    '/' + 'a'.repeat(3000),
  ]) {
    assert.equal(rutaInterna(malo, ORIGEN), null, JSON.stringify(malo));
  }
});
