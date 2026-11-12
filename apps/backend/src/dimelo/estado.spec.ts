// Pruebas de RED-18 (sin Nest ni base): node --test --experimental-strip-types apps/backend/src/dimelo/estado.spec.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { exigeEstado } from './estado.ts';

test('Mi Dímelo exige siempre el state, aunque llegue redirect_uri', () => {
  assert.equal(exigeEstado('GENERIC', 'https://otra.example/vuelta'), true);
  assert.equal(exigeEstado('generic', 'x'), true);
  assert.equal(exigeEstado('GENERIC', undefined), true);
  assert.equal(exigeEstado('GENERIC', ''), true);
});

test('lo demás queda como en Postiz', () => {
  assert.equal(exigeEstado('GOOGLE', undefined), true);
  assert.equal(exigeEstado('GOOGLE', 'postiz://vuelta'), false);
});
