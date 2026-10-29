// Pruebas de dw12 (sin Nest ni base): node --test --experimental-strip-types apps/backend/src/dimelo/dw12.spec.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { DIAS_SIN_ACCESO, SIN_LLAVES, filtroLimpieza } from './dw12.ts';

// Evalúa el filtro de Prisma sobre un canal de prueba (solo los operadores que usa filtroLimpieza).
type Canal = { token: string; refreshToken: string | null; deletedAt: Date | null; refreshNeeded: boolean; inBetweenSteps: boolean; updatedAt: Date };
const cumple = (c: Canal, f: any): boolean => {
  const campo = (k: string, v: any): boolean => {
    const x = (c as any)[k];
    if (v && typeof v === 'object' && !(v instanceof Date)) {
      if ('not' in v) return x !== v.not;
      if ('lt' in v) return x < v.lt;
    }
    return x === v;
  };
  return Object.entries(f).every(([k, v]: [string, any]) =>
    k === 'OR' ? v.some((g: any) => cumple(c, g)) : k === 'AND' ? v.every((g: any) => cumple(c, g)) : campo(k, v)
  );
};

const AHORA = new Date('2026-10-30T12:00:00Z');
const hace = (dias: number) => new Date(AHORA.getTime() - dias * 24 * 60 * 60 * 1000);
const canal = (o: Partial<Canal>): Canal => ({ token: 't', refreshToken: 'r', deletedAt: null, refreshNeeded: false, inBetweenSteps: false, updatedAt: hace(30), ...o });

test('sin llaves: token vacío, sin refresco ni caducidad', () => {
  assert.deepEqual(SIN_LLAVES, { token: '', refreshToken: null, tokenExpiration: null });
  assert.equal(DIAS_SIN_ACCESO, 7);
});

test('limpia los canales borrados que aún tienen llaves', () => {
  const f = filtroLimpieza(AHORA);
  assert.equal(cumple(canal({ deletedAt: hace(1) }), f), true);
  assert.equal(cumple(canal({ deletedAt: hace(1), token: '', refreshToken: 'r' }), f), true);
  assert.equal(cumple(canal({ deletedAt: hace(1), token: '', refreshToken: null }), f), false, 'ya limpio');
});

test('limpia los que no pueden entrar desde hace más de 7 días, no antes', () => {
  const f = filtroLimpieza(AHORA);
  assert.equal(cumple(canal({ refreshNeeded: true, updatedAt: hace(8) }), f), true);
  assert.equal(cumple(canal({ refreshNeeded: true, updatedAt: hace(6) }), f), false);
});

test('limpia los conectados a medias desde hace más de 7 días', () => {
  const f = filtroLimpieza(AHORA);
  assert.equal(cumple(canal({ inBetweenSteps: true, updatedAt: hace(8) }), f), true);
  assert.equal(cumple(canal({ inBetweenSteps: true, updatedAt: hace(1) }), f), false);
});

test('no toca los canales que funcionan', () => {
  const f = filtroLimpieza(AHORA);
  assert.equal(cumple(canal({}), f), false);
  assert.equal(cumple(canal({ updatedAt: hace(400) }), f), false);
});
