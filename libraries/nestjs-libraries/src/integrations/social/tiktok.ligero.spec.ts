// Pruebas de RED-07 (con el ffmpeg del sistema, sin red de fuera; solo un servidor en 127.0.0.1):
// node --require @swc-node/register --test libraries/nestjs-libraries/src/integrations/social/tiktok.ligero.spec.ts
import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { argumentosFfmpeg, descargarConTope } from './tiktok.ligero';

let hayFfmpeg = true;
try {
  execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
} catch {
  hayFfmpeg = false;
}

const ffmpeg = (args: string[]) =>
  new Promise<void>((r) => execFile('ffmpeg', args, { timeout: 30_000 }, () => r()));

test('RED-07: un «video» que es una lista HLS hacia la red interna no hace que ffmpeg la pida', { skip: !hayFfmpeg && 'sin ffmpeg' }, async () => {
  const pedidas: string[] = [];
  const server = http.createServer((req, res) => {
    pedidas.push(req.url || '');
    if (req.url === '/lista.mp4') {
      res.setHeader('content-type', 'application/vnd.apple.mpegurl');
      return res.end(`#EXTM3U\n#EXT-X-TARGETDURATION:1\n#EXTINF:1,\n/interno.ts\n#EXT-X-ENDLIST\n`);
    }
    res.end('');
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  const { port } = server.address() as AddressInfo;
  const dir = mkdtempSync(join(tmpdir(), 'ligero-'));
  try {
    // Así se llamaba antes (dw18): '-i', source, con source la dirección del medio → ffmpeg la abre él mismo
    // (fuera de la protección de red) y sigue la lista HLS hasta el segmento interno
    await ffmpeg(['-y', '-loglevel', 'error', '-i', `http://127.0.0.1:${port}/lista.mp4`, join(dir, 'antes.mp4')]);
    assert.ok(pedidas.includes('/lista.mp4') && pedidas.includes('/interno.ts'), 'reproducido: antes ffmpeg pedía a la red interna');
    pedidas.length = 0;
    // Ahora: aunque el archivo local (descargado o de la carpeta de subidas) sea una lista HLS, no se sigue
    const lista = join(dir, 'video.m3u8');
    writeFileSync(lista, `#EXTM3U\n#EXT-X-TARGETDURATION:1\n#EXTINF:1,\nhttp://127.0.0.1:${port}/interno.ts\n#EXT-X-ENDLIST\n`);
    await ffmpeg(argumentosFfmpeg(lista, join(dir, 'despues.mp4')));
    assert.deepEqual(pedidas, [], 'con los argumentos nuevos ffmpeg no abre nada fuera del archivo');
    assert.equal(existsSync(join(dir, 'despues.mp4')), false);
    // Lo mismo con la entrada como dirección o con concat:/subfile: ni se intenta
    for (const malo of [`http://127.0.0.1:${port}/v.mp4`, `concat:${lista}|${lista}`, `subfile,,start,0,end,0,,:${lista}`, 'video.mp4']) {
      assert.throws(() => argumentosFfmpeg(malo, join(dir, 'x.mp4')), malo);
    }
    assert.deepEqual(pedidas, []);
  } finally {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('RED-07: un video normal se sigue aligerando', { skip: !hayFfmpeg && 'sin ffmpeg' }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ligero-'));
  try {
    const entrada = join(dir, 'entrada.mp4');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc=size=320x240:rate=10', '-f', 'lavfi', '-i', 'sine', '-t', '1', '-pix_fmt', 'yuv420p', entrada]);
    await ffmpeg(argumentosFfmpeg(entrada, join(dir, 'salida.mp4')));
    assert.equal(existsSync(join(dir, 'salida.mp4')), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('RED-07: la descarga previa solo va a https público y respeta el tope', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ligero-'));
  const original = globalThis.fetch;
  try {
    for (const url of ['http://93.184.215.14/v.mp4', 'https://127.0.0.1/v.mp4', 'https://[::ffff:10.0.0.1]/v.mp4']) {
      await assert.rejects(descargarConTope(url, join(dir, 'd.mp4')), /Blocked URL/, url);
    }
    globalThis.fetch = (async () => new Response(new Uint8Array(2048))) as any;
    await assert.rejects(descargarConTope('https://93.184.215.14/v.mp4', join(dir, 'd.mp4'), 1024), /tope/);
    await descargarConTope('https://93.184.215.14/v.mp4', join(dir, 'd.mp4'), 4096);
    assert.equal(existsSync(join(dir, 'd.mp4')), true);
  } finally {
    globalThis.fetch = original;
    rmSync(dir, { recursive: true, force: true });
  }
});
