// Dímelo Redes (RED-08): lo que la pantalla oculta (marca/ocultar.txt) también se cierra en el servidor, para que nadie
// lo use llamando a la API directamente. Responde 404 como si no existiera.
// Se queda abierto lo que usa la pantalla que sí se ve (copilot del editor, billing de las comprobaciones de la
// pantalla, /public/posts y /public/stream de la vista previa y las miniaturas) y la API pública /public/v1, que usa el
// panel de Dímelo Web de servidor a servidor con la clave del espacio (que ya no llega al navegador: users.controller).
// Sin dependencias para poder probarlo con node --test (oculto.spec.ts).

// Prefijos de ruta del backend (sin /api). Cada uno cierra esa ruta y todo lo que cuelga de ella.
export const RUTAS_OCULTAS = [
  '/webhooks', // Ajustes > Webhooks
  '/user/oauth-app', // Ajustes > Apps (desarrolladores)
  '/user/approved-apps',
  '/oauth', // Postiz como proveedor OAuth de apps de terceros (/oauth/authorize, /oauth/token…)
  '/enterprise',
  '/user/api-key/rotate', // la clave del espacio la guarda el panel; cambiarla desde fuera lo deja sin acceso
  '/public/modify-subscription', // facturación (sin Stripe)
  '/public/agent', // agente de IA
  '/integrations/extension-refresh', // extensión del navegador
  // MCP: main.ts ya no lo arranca; por si acaso, también sus rutas
  '/mcp',
  '/mcp-oauth',
  '/mcp-oauth-chatgpt',
  '/mcp-oauth-claude',
  '/mcp-oauth-dynamic',
  '/.well-known/oauth-protected-resource',
  '/.well-known/oauth-authorization-server',
  '/.well-known/openid-configuration',
  '/.well-known/openai-apps-challenge',
];

// Express compara rutas sin distinguir mayúsculas, y una barra repetida o un final «/» no cambian el destino: se
// normaliza igual antes de comparar. Si la ruta no se puede leer, se cierra.
export function rutaOculta(ruta: unknown): boolean {
  if (typeof ruta !== 'string') {
    return true;
  }
  let limpia: string;
  try {
    limpia = decodeURIComponent(ruta.split('?')[0]);
  } catch {
    return true;
  }
  limpia = ('/' + limpia).replace(/[\\/]+/g, '/').toLowerCase();
  return RUTAS_OCULTAS.some((prefijo) => limpia === prefijo || limpia.startsWith(prefijo + '/') || limpia.startsWith(prefijo + '.'));
}

export function cerrarOculto(
  req: { path?: string; url?: string },
  res: { status: (n: number) => { json: (b: unknown) => unknown } },
  next: () => void
) {
  if (rutaOculta(req.path ?? req.url)) {
    res.status(404).json({ message: 'Not Found', statusCode: 404 });
    return;
  }
  next();
}
