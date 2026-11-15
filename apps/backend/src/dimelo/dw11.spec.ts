// Pruebas de dw11 (sin Nest ni base): node --test --experimental-strip-types apps/backend/src/dimelo/dw11.spec.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { panelOrigen, sesionDimelo, vistaDimelo } from './dw11.ts';

const ENV = { POSTIZ_OAUTH_AUTH_URL: 'https://admin.dimeloweb.com/panel/redes/autorizar' };

test('sesión: persona limpia, equipo solo si es true, vuelta solo a páginas del panel', () => {
  assert.deepEqual(sesionDimelo({ persona: '  Ana \n Pérez ', equipo: true, volver: '/panel/clients/cliente-a' }), {
    persona: 'Ana Pérez',
    equipo: true,
    volver: '/panel/clients/cliente-a',
    negocio: null,
    panel: null,
  });
  assert.deepEqual(sesionDimelo({ persona: 'x'.repeat(200), equipo: 'true', volver: '/panel?negocio=cliente-a' }), {
    persona: 'x'.repeat(80),
    equipo: false,
    volver: '/panel?negocio=cliente-a',
    negocio: null,
    panel: null,
  });
  for (const volver of ['//malo.example/panel', 'https://malo.example/panel', '/panel/../x', '/panel/.%2e/x', '/panel/%2E%2E/x', '/panelx', '/otra', '/panel\\x', '/panel/a b', 'javascript:alert(1)', 42]) {
    assert.equal(sesionDimelo({ volver }).volver, '/panel', String(volver));
  }
  assert.deepEqual(sesionDimelo(undefined), { persona: null, equipo: false, volver: '/panel', negocio: null, panel: null });
  assert.deepEqual(sesionDimelo({ persona: '   ' }), { persona: null, equipo: false, volver: '/panel', negocio: null, panel: null });
});

test('dw23: negocio (id de 1 a 200 sin espacios) y panel (https, o localhost para pruebas); si no, null', () => {
  assert.equal(sesionDimelo({ negocio: 'cliente-a-org' }).negocio, 'cliente-a-org');
  assert.equal(sesionDimelo({ negocio: 'x'.repeat(200) }).negocio, 'x'.repeat(200));
  for (const negocio of ['', ' ', 'con espacio', 'x'.repeat(201), 42, null]) assert.equal(sesionDimelo({ negocio }).negocio, null, String(negocio));
  assert.equal(sesionDimelo({ panel: 'https://admin.dimeloweb.com/panel?x=1' }).panel, 'https://admin.dimeloweb.com');
  assert.equal(sesionDimelo({ panel: 'http://localhost:3005/panel' }).panel, 'http://localhost:3005');
  assert.equal(sesionDimelo({ panel: 'http://panel.localhost:3000' }).panel, 'http://panel.localhost:3000');
  for (const panel of ['http://admin.dimeloweb.com', 'javascript:alert(1)', 'https://', 'no es una url', 42, null]) assert.equal(sesionDimelo({ panel }).panel, null, String(panel));
});

test('origen del panel: el del acceso de Mi Dímelo; si falta o es raro, el de siempre', () => {
  assert.equal(panelOrigen(ENV), 'https://admin.dimeloweb.com');
  assert.equal(panelOrigen({ POSTIZ_OAUTH_AUTH_URL: 'http://localhost:3005/panel/redes/autorizar' }), 'http://localhost:3005');
  assert.equal(panelOrigen({}), 'https://admin.dimeloweb.com');
  assert.equal(panelOrigen({ POSTIZ_OAUTH_AUTH_URL: 'javascript:alert(1)' }), 'https://admin.dimeloweb.com');
});

test('vista del menú: id del negocio, nombre, persona, dirección completa y panel; sesión vieja sin datos', () => {
  assert.deepEqual(vistaDimelo({ persona: 'Ana Pérez', equipo: true, volver: '/panel/clients/c1', negocio: 'c1', panel: 'https://admin.dimeloweb.com' }, 'Negocio Prueba', ENV), {
    negocio: 'c1',
    nombre: 'Negocio Prueba',
    persona: 'Ana Pérez',
    equipo: true,
    volver: 'https://admin.dimeloweb.com/panel/clients/c1',
    panel: 'https://admin.dimeloweb.com',
  });
  assert.deepEqual(vistaDimelo(undefined, 'Dímelo Web', ENV), {
    negocio: null,
    nombre: 'Dímelo Web',
    persona: null,
    equipo: false,
    volver: 'https://admin.dimeloweb.com/panel',
    panel: null,
  });
});
