// Dímelo Redes (dw18, RED-07): aligerar un video de TikTok con ffmpeg sin que ffmpeg abra nunca una dirección.
// - ffmpeg solo lee un archivo local ya confinado (en la carpeta de subidas, o el temporal que se descarga aquí).
// - Solo el protocolo «file» (-protocol_whitelist file, que vale también para lo que el archivo pida abrir dentro)
//   y solo el lector de MP4/MOV (-f mov): ni listas HLS, ni concat:, ni subfile, ni http, ni otros lectores.
// - La descarga de una dirección remota pasa por fetchPublicHttps: solo https público, cada salto revisado, con tope
//   de tamaño y de tiempo.
import { createWriteStream } from 'fs';
import { isAbsolute } from 'path';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { fetchPublicHttps } from '../../dtos/webhooks/ssrf.safe.dispatcher';

export const TOPE_VIDEO = 1024 * 1024 * 1024; // 1 GB, el mismo tope que una subida de video
export const TIEMPO_DESCARGA = 3 * 60 * 1000;

export function argumentosFfmpeg(entrada: string, salida: string): string[] {
  if (!isAbsolute(entrada) || !isAbsolute(salida) || /[\0\n\r]/.test(entrada + salida)) {
    throw new Error('ffmpeg solo trabaja con archivos locales');
  }
  return [
    '-y', '-loglevel', 'error',
    '-protocol_whitelist', 'file',
    '-f', 'mov',
    '-i', `file:${entrada}`,
    '-vf', "scale='min(1080,iw)':-2",
    '-c:v', 'libx264', '-preset', 'veryfast',
    '-b:v', '2500k', '-maxrate', '3000k', '-bufsize', '5000k',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart',
    `file:${salida}`,
  ];
}

export async function descargarConTope(
  url: string,
  destino: string,
  tope = TOPE_VIDEO,
  tiempo = TIEMPO_DESCARGA
): Promise<void> {
  const respuesta = await fetchPublicHttps(url, { headers: { 'accept-encoding': 'identity' } }, tiempo);
  if (!respuesta.ok || !respuesta.body) {
    await respuesta.body?.cancel();
    throw new Error('No se pudo descargar el video');
  }
  const declarado = Number(respuesta.headers.get('content-length'));
  if (declarado && declarado > tope) {
    await respuesta.body.cancel();
    throw new Error('El video pasa del tope');
  }
  let leidos = 0;
  const contar = new Transform({
    transform(trozo, _codificacion, listo) {
      leidos += trozo.length;
      listo(leidos > tope ? new Error('El video pasa del tope') : null, trozo);
    },
  });
  await pipeline(Readable.fromWeb(respuesta.body as any), contar, createWriteStream(destino, { mode: 0o600 }));
}
