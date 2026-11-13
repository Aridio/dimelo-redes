// Pruebas de RR-03 (un autopost guardado antes con http:// se omite con aviso, sin romper el flujo):
// node --require @swc-node/register --test libraries/nestjs-libraries/src/database/prisma/autopost/autopost.http.spec.ts
import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import { Logger } from '@nestjs/common';
import Module from 'node:module';

// Las dependencias de Nest del servicio se sustituyen por vacías: aquí solo se prueba startAutopost (integration.service
// y refresh.integration.service se importan entre sí y fuera de la aplicación no cargan).
const vacios = [
  /\/integrations\/integration\.service$/,
  /\/integrations\/refresh\.integration\.service$/,
  /\/posts\/posts\.service$/,
];
const cargar = (Module as any)._load;
(Module as any)._load = function (request: string, ...rest: any[]) {
  if (vacios.some((r) => r.test(request))) {
    return new Proxy({}, { get: () => class {} });
  }
  return cargar.call(this, request, ...rest);
};
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AutopostService } = require('./autopost.service');

const servicio = (url: string) => {
  const leidas: string[] = [];
  const service = new AutopostService(
    { getAutopost: async () => ({ id: 'a1', active: true, url, lastUrl: '' }) } as any,
    {} as any,
    { getIntegrationsList: async () => [] } as any,
    {} as any
  );
  service.loadXML = (async (u: string) => {
    leidas.push(u);
    return { success: false };
  }) as any;
  return { service, leidas };
};

test('RR-03: un autopost con http:// guardado en dw21 se omite, con aviso en el registro y sin error', async () => {
  const warn = Logger.prototype.warn;
  const avisos: string[] = [];
  Logger.prototype.warn = function (m: any) {
    avisos.push(String(m));
  } as any;
  try {
    for (const url of ['http://blog.example.com/feed', 'HTTP://blog.example.com/feed', '']) {
      const { service, leidas } = servicio(url);
      await assert.doesNotReject(service.startAutopost('a1'));
      assert.deepEqual(leidas, [], `no se descarga ${url}`);
    }
    assert.equal(avisos.length, 3);
    assert.match(avisos[0], /Autopost a1 omitido: .*https:\/\//);
  } finally {
    Logger.prototype.warn = warn;
  }
});

test('RR-03: uno con https:// se sigue leyendo', async () => {
  const { service, leidas } = servicio('https://blog.example.com/feed');
  await service.startAutopost('a1');
  assert.deepEqual(leidas, ['https://blog.example.com/feed']);
});
