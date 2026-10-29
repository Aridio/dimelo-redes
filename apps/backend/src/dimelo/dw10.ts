// dw10 (spec 050 de dimelo-web-admin): reglas de las dos rutas que usa el panel de Dímelo Web para publicar desde el
// chat del cliente. Sin decoradores ni alias para poder probarlas con `node --test --experimental-strip-types`
// (apps/backend/src/dimelo/dw10.test.ts).
import { createHash, timingSafeEqual } from 'node:crypto';

// La clave compartida con el panel (DIMELO_PANEL_SECRET). Sin ella, o corta, la ruta no existe.
export function panelSecret(env: Record<string, string | undefined>): string {
  const value = (env.DIMELO_PANEL_SECRET || '').trim();
  return value.length >= 32 ? value : '';
}

// Comparación en tiempo constante (por huella, para no depender del largo).
export function secretOk(given: unknown, expected: string): boolean {
  if (!expected || typeof given !== 'string' || !given) return false;
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

// Solo correos de negocio de Mi Dímelo (correoDeNegocio de la spec 039): nunca un correo cualquiera.
export function businessEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,62}@redes\.dimeloweb\.com$/.test(email) ? email : null;
}

type ExistingPost = {
  id: string;
  state: string;
  publishDate: Date | string;
  parentPostId?: string | null;
};

// ¿Se puede editar el grupo? No si alguna parte ya salió o está saliendo (en cola con la hora ya pasada).
export function editBlocked(posts: ExistingPost[], now: Date): 'publicada' | 'en-curso' | null {
  if (posts.some((post) => post.state === 'PUBLISHED')) return 'publicada';
  if (posts.some((post) => post.state === 'QUEUE' && new Date(post.publishDate).getTime() <= now.getTime() + 60_000)) return 'en-curso';
  return null;
}

export class EditError extends Error {}

// El cuerpo de PUT /posts/group/:group (igual que POST /posts, una sola red) pasado a lo que guarda la pantalla al
// editar: mismo grupo, mismos id de valor en orden, misma red, fecha y ajustes de antes si no llegan.
export function editBody(
  raw: any,
  current: { group: string; integration: string; settings: any; posts: ExistingPost[] }
) {
  const posts = Array.isArray(raw?.posts) ? raw.posts : [];
  if (posts.length !== 1) throw new EditError('Send exactly one post');
  const post = posts[0];
  if (post?.integration?.id !== current.integration) throw new EditError('The channel of a post cannot change');
  const values = Array.isArray(post.value) ? post.value : [];
  if (!values.length) throw new EditError('Post value is required');
  const type = raw?.type ?? (current.posts.every((item) => item.state === 'DRAFT') ? 'draft' : 'schedule');
  if (type !== 'draft' && type !== 'schedule') throw new EditError('type must be draft or schedule');
  const date = raw?.date ?? new Date(current.posts[0].publishDate).toISOString();
  if (Number.isNaN(Date.parse(date))) throw new EditError('Invalid date');
  // Los id existentes, del primero (sin padre) a los comentarios, en el orden en que se guardaron.
  const ordered: ExistingPost[] = [];
  let parent: string | null = null;
  for (;;) {
    const next = current.posts.find((item) => (item.parentPostId ?? null) === parent && !ordered.includes(item));
    if (!next) break;
    ordered.push(next);
    parent = next.id;
  }
  return {
    type,
    date,
    shortLink: Boolean(raw?.shortLink),
    tags: Array.isArray(raw?.tags) ? raw.tags : [],
    posts: [
      {
        integration: { id: current.integration },
        group: current.group,
        settings: post.settings ?? current.settings ?? {},
        value: values.map((value: any, index: number) => ({
          content: typeof value?.content === 'string' ? value.content : '',
          image: Array.isArray(value?.image) ? value.image : [],
          ...(ordered[index] ? { id: ordered[index].id } : {}),
        })),
      },
    ],
  };
}
