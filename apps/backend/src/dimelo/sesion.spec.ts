// Pruebas de RED-12 (sin Nest ni base): node --test --experimental-strip-types apps/backend/src/dimelo/sesion.spec.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { sesionConVencimiento } from './sesion.ts';

test('una sesión lleva vencimiento; lo demás firmado con la misma clave no sirve para entrar', () => {
  assert.equal(sesionConVencimiento({ id: 'u1', providerName: 'GENERIC', exp: 1_900_000_000 }), true);
  assert.equal(sesionConVencimiento({ id: 'u1', providerName: 'LOCAL', exp: 1_900_000_000 }), true);
  // cuenta LOCAL de antes (no vencía), enlace de cambiar la clave, código de activar
  assert.equal(sesionConVencimiento({ id: 'u1', providerName: 'LOCAL' }), false);
  assert.equal(sesionConVencimiento({ id: 'u1', expires: '2026-11-12 10:00:00' }), false);
  assert.equal(sesionConVencimiento({ id: 'u1', email: 'a@b.c', activated: false }), false);
  for (const exp of ['1900000000', null, NaN, Infinity, 0, -1, {}]) {
    assert.equal(sesionConVencimiento({ id: 'u1', exp }), false, String(exp));
  }
  assert.equal(sesionConVencimiento(null), false);
});
