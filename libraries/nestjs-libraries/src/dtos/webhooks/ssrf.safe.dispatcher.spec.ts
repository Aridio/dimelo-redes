// Pruebas de RED-06 / V6-N03 (sin Nest ni red de fuera; solo un servidor en 127.0.0.1):
// node --require @swc-node/register --test libraries/nestjs-libraries/src/dtos/webhooks/ssrf.safe.dispatcher.spec.ts
import assert from 'node:assert/strict';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import {
  fetchPublicHttps,
  getSsrfSafeAxios,
  ssrfSafeDispatcher,
} from './ssrf.safe.dispatcher';
import { isBlockedIp } from './webhook.url.validator';

const interno = async () => {
  const hits: string[] = [];
  const server = http.createServer((req, res) => {
    hits.push(req.url || '');
    res.end('secreto interno');
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  const { port } = server.address() as AddressInfo;
  return { server, port, hits };
};

test('V6-N03: una IP literal interna no se alcanza con el dispatcher (antes 200 sin pasar por lookup)', async () => {
  const { server, port, hits } = await interno();
  try {
    await assert.rejects(
      fetch(`http://127.0.0.1:${port}/x`, {
        // @ts-ignore
        dispatcher: ssrfSafeDispatcher,
      })
    );
    await assert.rejects(
      fetch(`http://[::ffff:127.0.0.1]:${port}/x`, {
        // @ts-ignore
        dispatcher: ssrfSafeDispatcher,
      })
    );
    assert.deepEqual(hits, [], 'el servidor interno no recibió ninguna petición');
  } finally {
    server.close();
  }
});

test('V6-N03: tampoco con axios (proveedores que suben con form-data)', async () => {
  const { server, port, hits } = await interno();
  try {
    await assert.rejects(getSsrfSafeAxios()({ url: `http://127.0.0.1:${port}/x` }));
    assert.deepEqual(hits, []);
  } finally {
    server.close();
  }
});

test('RED-04: IPv6 que envuelve IPv4, NAT64 y 6to4 cuentan como internas', () => {
  for (const ip of ['::ffff:7f00:1', '::ffff:127.0.0.1', '::ffff:a9fe:a9fe', '64:ff9b::7f00:1', '2002:7f00:1::', '::1', 'fd00::1', '10.0.0.1', '169.254.169.254']) {
    assert.equal(isBlockedIp(ip), true, ip);
  }
  assert.equal(isBlockedIp('93.184.215.14'), false);
});

test('RED-06: copiar desde enlace sigue los saltos a mano y revisa cada uno', async () => {
  const original = globalThis.fetch;
  const pedidas: string[] = [];
  const saltoA = (destino: string) => {
    globalThis.fetch = (async (url: string, init: any) => {
      pedidas.push(url);
      assert.equal(init.redirect, 'manual');
      assert.ok(init.signal, 'lleva tope de tiempo');
      return new Response(null, { status: 302, headers: { location: destino } });
    }) as any;
  };
  try {
    // Público (IP literal, sin DNS) que redirige a una IP interna, a la forma IPv6 de 127.0.0.1, a metadatos o a http
    for (const destino of [
      'http://127.0.0.1:9200/',
      'https://127.0.0.1/',
      'https://[::ffff:127.0.0.1]/',
      'https://169.254.169.254/latest/meta-data/',
      'http://93.184.215.14/foto.jpg',
      'https://localhost/',
    ]) {
      pedidas.length = 0;
      saltoA(destino);
      await assert.rejects(fetchPublicHttps('https://93.184.215.14/foto.jpg'), /Blocked URL/, destino);
      assert.deepEqual(pedidas, ['https://93.184.215.14/foto.jpg'], `no siguió a ${destino}`);
    }
    // Saltos públicos sin fin: se para
    pedidas.length = 0;
    saltoA('https://93.184.215.14/otra');
    await assert.rejects(fetchPublicHttps('https://93.184.215.14/foto.jpg'), /Too many redirects/);
    assert.equal(pedidas.length, 4);
    // Ni http ni direcciones internas desde el principio
    for (const url of ['http://93.184.215.14/foto.jpg', 'https://10.0.0.5/foto.jpg', 'file:///etc/passwd']) {
      await assert.rejects(fetchPublicHttps(url), /Blocked URL/, url);
    }
  } finally {
    globalThis.fetch = original;
  }
});

test('RR-07: el resto de rangos internos o reservados de IANA cuentan como internos', () => {
  for (const ip of [
    '192.0.0.1', '192.0.0.170', '192.0.2.10', '192.88.99.1', '198.51.100.7', '203.0.113.9', '240.0.0.1', '255.255.255.255',
    '::ffff:192.0.0.1', '64:ff9b::c000:1', '2002:c000:0201::',
    '64:ff9b:1::a00:1', '100::1', '2001::1', '2001:db8::1', '3fff::1', '5f00::1',
  ]) {
    assert.equal(isBlockedIp(ip), true, ip);
  }
  // lo público sigue pasando (también IPv6 de Google y de Cloudflare, y NAT64 de una IPv4 pública)
  for (const ip of ['8.8.8.8', '192.0.3.1', '203.0.114.1', '2001:4860:4860::8888', '2606:4700:4700::1111', '64:ff9b::808:808']) {
    assert.equal(isBlockedIp(ip), false, ip);
  }
});

test('RR-07: las descargas solo van al puerto 443', async () => {
  const original = globalThis.fetch;
  const pedidas: string[] = [];
  try {
    globalThis.fetch = (async (url: string) => {
      pedidas.push(url);
      return new Response('ok', { status: 200 });
    }) as any;
    // otro puerto, desde el principio
    for (const url of ['https://93.184.215.14:8443/foto.jpg', 'https://93.184.215.14:22/', 'https://93.184.215.14:80/']) {
      await assert.rejects(fetchPublicHttps(url), /Blocked URL/, url);
    }
    assert.deepEqual(pedidas, []);
    // 443 escrito o sin escribir
    assert.equal((await fetchPublicHttps('https://93.184.215.14/foto.jpg')).status, 200);
    assert.equal((await fetchPublicHttps('https://93.184.215.14:443/foto.jpg')).status, 200);
    // ni por una redirección a otro puerto
    pedidas.length = 0;
    globalThis.fetch = (async (url: string) => {
      pedidas.push(url);
      return new Response(null, { status: 302, headers: { location: 'https://93.184.215.14:9200/_cat' } });
    }) as any;
    await assert.rejects(fetchPublicHttps('https://93.184.215.14/foto.jpg'), /Blocked URL/);
    assert.deepEqual(pedidas, ['https://93.184.215.14/foto.jpg']);
  } finally {
    globalThis.fetch = original;
  }
});
