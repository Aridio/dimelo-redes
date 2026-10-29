// Pruebas de dw10 (sin Nest ni base): node --test --experimental-strip-types apps/backend/src/dimelo/dw10.spec.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { businessEmail, editBlocked, editBody, EditError, panelSecret, secretOk } from './dw10.ts';

const SECRET = 'clave-compartida-de-prueba-0123456789-abcdef';

test('clave compartida: sin variable o corta, no hay ruta; compara exacto', () => {
  assert.equal(panelSecret({}), '');
  assert.equal(panelSecret({ DIMELO_PANEL_SECRET: 'corta' }), '');
  assert.equal(panelSecret({ DIMELO_PANEL_SECRET: ` ${SECRET} ` }), SECRET);
  assert.equal(secretOk(SECRET, SECRET), true);
  assert.equal(secretOk(`${SECRET}x`, SECRET), false);
  assert.equal(secretOk('', SECRET), false);
  assert.equal(secretOk(undefined, SECRET), false);
  assert.equal(secretOk(SECRET, ''), false);
});

test('correo: solo correos de negocio de Mi Dímelo', () => {
  assert.equal(businessEmail('cliente-a-org@redes.dimeloweb.com'), 'cliente-a-org@redes.dimeloweb.com');
  assert.equal(businessEmail(' Negocio-1@Redes.DimeloWeb.com '), 'negocio-1@redes.dimeloweb.com');
  assert.equal(businessEmail('aridio89@gmail.com'), null);
  assert.equal(businessEmail('a@redes.dimeloweb.com.evil.com'), null);
  assert.equal(businessEmail("x'@redes.dimeloweb.com"), null);
  assert.equal(businessEmail(null), null);
});

test('editar: no si ya salió o está saliendo; sí si está en cola para después, en borrador o falló', () => {
  const now = new Date('2026-10-30T12:00:00Z');
  const later = '2026-10-31T10:00:00Z';
  assert.equal(editBlocked([{ id: '1', state: 'PUBLISHED', publishDate: later }], now), 'publicada');
  assert.equal(editBlocked([{ id: '1', state: 'QUEUE', publishDate: '2026-10-30T12:00:30Z' }], now), 'en-curso');
  assert.equal(editBlocked([{ id: '1', state: 'QUEUE', publishDate: '2026-10-30T11:00:00Z' }], now), 'en-curso');
  assert.equal(editBlocked([{ id: '1', state: 'QUEUE', publishDate: later }], now), null);
  assert.equal(editBlocked([{ id: '1', state: 'DRAFT', publishDate: '2026-10-29T10:00:00Z' }], now), null);
  assert.equal(editBlocked([{ id: '1', state: 'ERROR', publishDate: '2026-10-29T10:00:00Z' }], now), null);
});

const NOW = new Date('2026-10-30T12:00:00Z');
const current = {
  group: 'g1',
  integration: 'ig-1',
  settings: { __type: 'instagram', post_type: 'post' },
  posts: [
    { id: 'c1', state: 'QUEUE', publishDate: '2026-10-31T14:00:00.000Z', parentPostId: 'p1', content: '<p>comentario</p>', image: [], delay: 5 },
    { id: 'p1', state: 'QUEUE', publishDate: '2026-10-31T14:00:00.000Z', parentPostId: null, content: '<p>antes</p>', image: [{ id: 'm0', path: 'https://x/0.jpg' }], intervalInDays: 7, tags: [{ tag: { name: 'Oferta' } }] },
  ],
};

test('editar: mismo grupo, mismos id en orden; lo que no llega se queda (fecha, fotos, etiquetas, repetición, retraso)', () => {
  const body = editBody({ posts: [{ integration: { id: 'ig-1' }, value: [{ content: 'Nuevo' }] }] }, current, NOW);
  assert.equal(body.type, 'schedule');
  assert.equal(body.date, '2026-10-31T14:00:00.000Z');
  assert.equal(body.inter, 7);
  assert.deepEqual(body.tags, [{ value: 'Oferta', label: 'Oferta' }]);
  assert.equal(body.posts[0].group, 'g1');
  assert.deepEqual(body.posts[0].settings, current.settings);
  assert.deepEqual(body.posts[0].value, [
    { content: 'Nuevo', image: [{ id: 'm0', path: 'https://x/0.jpg' }], id: 'p1' },
    { content: '<p>comentario</p>', image: [], delay: 5, id: 'c1' },
  ]);
  // Solo fotos: el texto se queda; fotos nuevas reemplazan.
  const fotos = editBody({ posts: [{ integration: { id: 'ig-1' }, value: [{ image: [{ id: 'm1', path: 'https://x/a.jpg' }] }] }] }, current, NOW);
  assert.deepEqual(fotos.posts[0].value[0], { content: '<p>antes</p>', image: [{ id: 'm1', path: 'https://x/a.jpg' }], id: 'p1' });
  const two = editBody({ date: '2026-11-01T13:00:00.000Z', posts: [{ integration: { id: 'ig-1' }, value: [{ content: 'a' }, { content: 'b' }, { content: 'c' }] }] }, current, NOW);
  assert.equal(two.date, '2026-11-01T13:00:00.000Z');
  assert.deepEqual(two.posts[0].value.map((v: any) => v.id), ['p1', 'c1', undefined]);
  assert.equal((two.posts[0].value[1] as any).delay, 5);
});

test('editar: nunca sale en el acto; fechas con zona', () => {
  const fallida = { ...current, posts: [{ id: 'p1', state: 'ERROR', publishDate: '2026-10-29T10:00:00.000Z', parentPostId: null }] };
  assert.throws(() => editBody({ posts: [{ integration: { id: 'ig-1' }, value: [{ content: 'x' }] }] }, fallida, NOW), EditError);
  assert.equal(editBody({ date: '2026-11-02T10:00:00Z', posts: [{ integration: { id: 'ig-1' }, value: [{ content: 'x' }] }] }, fallida, NOW).date, '2026-11-02T10:00:00Z');
  assert.throws(() => editBody({ date: '2026-10-30T12:00:30Z', posts: [{ integration: { id: 'ig-1' }, value: [{ content: 'x' }] }] }, current, NOW), EditError);
  assert.throws(() => editBody({ date: '2026-11-02T10:00:00', posts: [{ integration: { id: 'ig-1' }, value: [{ content: 'x' }] }] }, current, NOW), EditError);
  assert.equal(editBody({ date: '2026-11-02T10:00:00-04:00', posts: [{ integration: { id: 'ig-1' }, value: [{ content: 'x' }] }] }, current, NOW).date, '2026-11-02T10:00:00-04:00');
});

test('editar: un borrador sigue en borrador (aunque la fecha sea vieja); no cambia de red; datos malos se rechazan', () => {
  const draft = { ...current, posts: current.posts.map((p) => ({ ...p, state: 'DRAFT', publishDate: '2026-10-01T10:00:00.000Z' })) };
  assert.equal(editBody({ posts: [{ integration: { id: 'ig-1' }, value: [{ content: 'x' }] }] }, draft, NOW).type, 'draft');
  assert.throws(() => editBody({ posts: [{ integration: { id: 'fb-1' }, value: [{ content: 'x' }] }] }, current, NOW), EditError);
  assert.throws(() => editBody({ posts: [] }, current, NOW), EditError);
  assert.throws(() => editBody({ posts: [{ integration: { id: 'ig-1' }, value: [] }] }, current, NOW), EditError);
  assert.throws(() => editBody({ type: 'now', posts: [{ integration: { id: 'ig-1' }, value: [{ content: 'x' }] }] }, current, NOW), EditError);
  assert.throws(() => editBody({ date: 'mañana', posts: [{ integration: { id: 'ig-1' }, value: [{ content: 'x' }] }] }, current, NOW), EditError);
});
