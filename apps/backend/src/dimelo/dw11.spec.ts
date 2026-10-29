// Pruebas de dw11 (sin Nest ni base): node --test --experimental-strip-types apps/backend/src/dimelo/dw11.spec.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { panelOrigen, sesionDimelo, vistaDimelo } from './dw11.ts';

const ENV = { POSTIZ_OAUTH_AUTH_URL: 'https://admin.dimeloweb.com/panel/redes/autorizar' };

test('sesión: persona limpia, equipo solo si es true, vuelta solo a páginas del panel', () => {
  assert.deepEqual(sesionDimelo({ persona: '  Aridio \n Santana ', equipo: true, volver: '/panel/clients/cliente-a' }), {
    persona: 'Aridio Santana',
    equipo: true,
    volver: '/panel/clients/cliente-a',
  });
  assert.deepEqual(sesionDimelo({ persona: 'x'.repeat(200), equipo: 'true', volver: '/panel?negocio=cliente-a' }), {
    persona: 'x'.repeat(80),
    equipo: false,
    volver: '/panel?negocio=cliente-a',
  });
  for (const volver of ['//malo.example/panel', 'https://malo.example/panel', '/panel/../x', '/panelx', '/otra', '/panel\\x', '/panel/a b', 'javascript:alert(1)', 42]) {
    assert.equal(sesionDimelo({ volver }).volver, '/panel', String(volver));
  }
  assert.deepEqual(sesionDimelo(undefined), { persona: null, equipo: false, volver: '/panel' });
  assert.deepEqual(sesionDimelo({ persona: '   ' }), { persona: null, equipo: false, volver: '/panel' });
});

test('origen del panel: el del acceso de Mi Dímelo; si falta o es raro, el de siempre', () => {
  assert.equal(panelOrigen(ENV), 'https://admin.dimeloweb.com');
  assert.equal(panelOrigen({ POSTIZ_OAUTH_AUTH_URL: 'http://localhost:3005/panel/redes/autorizar' }), 'http://localhost:3005');
  assert.equal(panelOrigen({}), 'https://admin.dimeloweb.com');
  assert.equal(panelOrigen({ POSTIZ_OAUTH_AUTH_URL: 'javascript:alert(1)' }), 'https://admin.dimeloweb.com');
});

test('vista del menú: negocio, persona y dirección completa; sesión vieja sin datos', () => {
  assert.deepEqual(vistaDimelo({ persona: 'Aridio Santana', equipo: true, volver: '/panel/clients/c1' }, 'Christopher Ventura', ENV), {
    negocio: 'Christopher Ventura',
    persona: 'Aridio Santana',
    equipo: true,
    volver: 'https://admin.dimeloweb.com/panel/clients/c1',
  });
  assert.deepEqual(vistaDimelo(undefined, 'Dímelo Web', ENV), {
    negocio: 'Dímelo Web',
    persona: null,
    equipo: false,
    volver: 'https://admin.dimeloweb.com/panel',
  });
});
