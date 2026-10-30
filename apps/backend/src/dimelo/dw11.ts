// dw11 (spec 039 de dimelo-web-admin): quién está conectado en Dímelo Redes y adónde lleva «Volver a Mi Dímelo».
// Mi Dímelo manda, al entrar, quién entra (dimelo_persona), si es del equipo de Dímelo Web (dimelo_equipo) y la página
// del panel a la que volver (dimelo_volver). Va en la sesión (la clave firmada), no en el usuario del negocio: varias
// personas comparten ese usuario. Sin decoradores ni alias para probarlo con `node --test --experimental-strip-types`
// (apps/backend/src/dimelo/dw11.spec.ts).

export type SesionDimelo = { persona: string | null; equipo: boolean; volver: string };
export type VistaDimelo = { negocio: string | null; persona: string | null; equipo: boolean; volver: string };

const PANEL = 'https://admin.dimeloweb.com';
// Solo páginas del panel, sin otro servidor ni saltos raros.
const RUTA = /^\/panel(?:\/[A-Za-z0-9_.%-]+)*\/?(?:\?[A-Za-z0-9_.%=&-]*)?$/;

const texto = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null;
  const limpio = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return limpio ? limpio.slice(0, max) : null;
};

// Lo que llega de Mi Dímelo (datos del usuario de OAuth), limpio para guardarlo en la sesión.
export function sesionDimelo(datos: unknown): SesionDimelo {
  const d = (datos && typeof datos === 'object' ? datos : {}) as Record<string, unknown>;
  const volver = typeof d.volver === 'string' && RUTA.test(d.volver) && !/\.\.|%2e/i.test(d.volver) ? d.volver : '/panel';
  return { persona: texto(d.persona, 80), equipo: d.equipo === true, volver };
}

// Dirección del panel: la del acceso de Mi Dímelo (POSTIZ_OAUTH_AUTH_URL), sin la ruta.
export function panelOrigen(env: Record<string, string | undefined>): string {
  try {
    const url = new URL(env.POSTIZ_OAUTH_AUTH_URL || '');
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : PANEL;
  } catch {
    return PANEL;
  }
}

// Lo que ve el menú: el negocio (nombre del espacio), la persona y la dirección completa de «Volver».
// Las sesiones de antes de dw11 no traen nada: se ve el negocio y «Volver a Mi Dímelo» al Inicio.
export function vistaDimelo(
  sesion: unknown,
  negocio: unknown,
  env: Record<string, string | undefined>
): VistaDimelo {
  const s = sesionDimelo(sesion);
  return { negocio: texto(negocio, 120), persona: s.persona, equipo: s.equipo, volver: panelOrigen(env) + s.volver };
}
