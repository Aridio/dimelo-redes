// Pruebas de RED-18 / RR-05 (cuándo se exige el state de la entrada; lo dice cada proveedor, no el código genérico):
// node --require @swc-node/register --test apps/backend/src/dimelo/estado.spec.ts
import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import { OauthProvider } from '../services/auth/providers/oauth.provider';
import { GithubProvider } from '../services/auth/providers/github.provider';

test('Mi Dímelo (GENERIC) exige siempre el state, aunque llegue redirect_uri', () => {
  const generic = new OauthProvider();
  assert.equal(generic.requiresState('https://otra.example/vuelta'), true);
  assert.equal(generic.requiresState(undefined), true);
  assert.equal(generic.requiresState(''), true);
});

test('los demás proveedores quedan como en Postiz (sin state solo con redirect_uri de la app móvil)', () => {
  const github = new GithubProvider();
  assert.equal(github.requiresState(undefined), true);
  assert.equal(github.requiresState('postiz://vuelta'), false);
});
