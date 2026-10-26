// Recorrido de Dímelo Redes en la copia de prueba (quickstart.md § 1 de la spec 032):
// pantallas con y sin sesión, en celular, tablet y computadora, claro y oscuro.
// Guarda capturas en marca/prueba/capturas/ y falla si alguna página dice Postiz/Gitroom,
// enlaza a postiz.com, no lleva «Dímelo Redes» en el título o se desborda a lo ancho.
// Uso: BASE=http://localhost:4007 AUTH=<cookie auth> node marca/prueba/recorrido.mjs
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4007';
const AUTH = process.env.AUTH;
const SALIDA = new URL('./capturas/', import.meta.url).pathname;
mkdirSync(SALIDA, { recursive: true });

const TAMANOS = { celular: [375, 812], tablet: [820, 1180], computadora: [1440, 900] };
const SIN_SESION = ['/auth/login', '/auth', '/auth/forgot'];
const CON_SESION = ['/launches', '/settings', '/media', '/analytics', '/p/no-existe', '/esta-pagina-no-existe'];
const PERMITIDO = /@gitroom\/[\w./-]+|@postiz\/[\w./-]+|\b[A-Z0-9_]*POSTIZ[A-Z0-9_]*\b/g;

const problemas = [];
const host = new URL(BASE).hostname;

async function revisar(page, nombre) {
  const datos = await page.evaluate(() => ({
    titulo: document.title,
    texto: document.body?.innerText || '',
    enlaces: [...document.querySelectorAll('a[href],img[src],link[href],meta[content]')].map(
      (e) => e.getAttribute('href') || e.getAttribute('src') || e.getAttribute('content') || ''
    ),
    ancho: document.documentElement.scrollWidth,
    vista: window.innerWidth,
    atributos: [...document.querySelectorAll('[placeholder],[alt],[title],[aria-label]')].map((e) =>
      ['placeholder', 'alt', 'title', 'aria-label'].map((a) => e.getAttribute(a) || '').join(' ')
    ),
  }));
  const todo = [datos.titulo, datos.texto, ...datos.atributos].join('\n').replace(PERMITIDO, '');
  const visto = todo.match(/.{0,40}(postiz|gitroom).{0,40}/i);
  if (visto) problemas.push(`${nombre}: dice «${visto[0].trim()}»`);
  const enlace = datos.enlaces.find((h) => /(postiz|gitroom)\.(com|pro)|docs\.postiz/i.test(h));
  if (enlace) problemas.push(`${nombre}: enlace a ${enlace}`);
  if (!/Dímelo Redes/.test(datos.titulo)) problemas.push(`${nombre}: título «${datos.titulo}»`);
  if (datos.ancho > datos.vista + 2) problemas.push(`${nombre}: se sale de lado (${datos.ancho}px en ${datos.vista}px)`);
}

const navegador = await chromium.launch();
for (const modo of ['oscuro', 'claro']) {
  for (const [tamano, [ancho, alto]] of Object.entries(TAMANOS)) {
    for (const conSesion of [false, true]) {
      if (conSesion && !AUTH) continue;
      const contexto = await navegador.newContext({
        viewport: { width: ancho, height: alto },
        locale: 'es-ES',
        isMobile: tamano === 'celular',
        hasTouch: tamano === 'celular',
      });
      const galletas = [
        { name: 'i18next', value: 'es', domain: host, path: '/' },
        { name: 'mode', value: modo === 'oscuro' ? 'dark' : 'light', domain: host, path: '/' },
      ];
      if (conSesion) galletas.push({ name: 'auth', value: AUTH, domain: host, path: '/' });
      await contexto.addCookies(galletas);
      const page = await contexto.newPage();
      for (const ruta of conSesion ? CON_SESION : SIN_SESION) {
        const nombre = `${modo}-${tamano}${ruta.replaceAll('/', '_')}`;
        await page.goto(BASE + ruta, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${SALIDA}${nombre}.png`, fullPage: true });
        await revisar(page, nombre);
        // Calendario: abrir «Agregar canal» para ver la lista de redes
        if (ruta === '/launches') {
          // el menú lateral de computadora queda oculto en celular: buscar solo el botón visible
          const boton = page.locator('text=/agregar canal|añadir canal|add channel/i >> visible=true').first();
          if (await boton.isVisible().catch(() => false)) {
            await boton.click().catch(() => {});
            await page.waitForTimeout(1500);
            await page.screenshot({ path: `${SALIDA}${nombre}_anadir-canal.png`, fullPage: true });
            await revisar(page, `${nombre} (añadir canal)`);
            await page.keyboard.press('Escape').catch(() => {});
          } else {
            problemas.push(`${nombre}: no encontré el botón «Agregar canal»`);
          }
        }
      }
      await contexto.close();
    }
  }
}
await navegador.close();

writeFileSync(`${SALIDA}resultado.txt`, problemas.length ? problemas.join('\n') + '\n' : 'Sin problemas\n');
if (problemas.length) {
  console.log(problemas.join('\n'));
  console.log(`${problemas.length} problema(s) en el recorrido.`);
  process.exit(1);
}
console.log('Recorrido sin «Postiz», en celular, tablet y computadora, claro y oscuro.');
