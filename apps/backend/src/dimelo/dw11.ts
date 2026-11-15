// dw11 (spec 039 de dimelo-web-admin): quién está conectado en Dímelo Redes y adónde lleva «Volver a Mi Dímelo».
// Mi Dímelo manda, al entrar, quién entra (dimelo_persona), si es del equipo de Dímelo Web (dimelo_equipo), la página
// del panel a la que volver (dimelo_volver), el negocio (dimelo_negocio, dw23) y el origen del panel (dimelo_panel, dw23).
// Va en la sesión (la clave firmada), no en el usuario del negocio: varias personas comparten ese usuario. Sin decoradores
// ni alias para probarlo con `node --test --experimental-strip-types` (apps/backend/src/dimelo/dw11.spec.ts).

export type SesionDimelo = { persona: string | null; equipo: boolean; volver: string; negocio: string | null; panel: string | null };
export type VistaDimelo = { negocio: string | null; nombre: string | null; persona: string | null; equipo: boolean; volver: string; panel: string | null };

const PANEL = 'https://admin.dimeloweb.com';
// Solo páginas del panel, sin otro servidor ni saltos raros.
const RUTA = /^\/panel(?:\/[A-Za-z0-9_.%-]+)*\/?(?:\?[A-Za-z0-9_.%=&-]*)?$/;

const texto = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null;
  const limpio = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return limpio ? limpio.slice(0, max) : null;
};

// Id del negocio en Mi Dímelo: texto de 1 a 200 caracteres, sin espacios.
const idNegocio = (value: unknown): string | null => (typeof value === 'string' && /^\S{1,200}$/.test(value) ? value : null);

// Origen del panel: https, o http solo para pruebas en localhost (o *.localhost). Si no, null.
const origenPanel = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    const local = url.hostname === 'localhost' || url.hostname.endsWith('.localhost');
    return url.protocol === 'https:' || (url.protocol === 'http:' && local) ? url.origin : null;
  } catch {
    return null;
  }
};

// Lo que llega de Mi Dímelo (datos del usuario de OAuth), limpio para guardarlo en la sesión.
export function sesionDimelo(datos: unknown): SesionDimelo {
  const d = (datos && typeof datos === 'object' ? datos : {}) as Record<string, unknown>;
  const volver = typeof d.volver === 'string' && RUTA.test(d.volver) && !/\.\.|%2e/i.test(d.volver) ? d.volver : '/panel';
  return { persona: texto(d.persona, 80), equipo: d.equipo === true, volver, negocio: idNegocio(d.negocio), panel: origenPanel(d.panel) };
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

// Lo que ve el menú: el id del negocio (dimelo.negocio), su nombre, la persona, la dirección completa de «Volver» y el
// origen del panel para el cambio de negocio (dimelo.panel). Las sesiones de antes de dw11 no traen nada: se ve el
// negocio y «Volver a Mi Dímelo» al Inicio, y no sale «Cambiar de negocio».
export function vistaDimelo(
  sesion: unknown,
  nombre: unknown,
  env: Record<string, string | undefined>
): VistaDimelo {
  const s = sesionDimelo(sesion);
  return { negocio: s.negocio, nombre: texto(nombre, 120), persona: s.persona, equipo: s.equipo, volver: panelOrigen(env) + s.volver, panel: s.panel };
}
