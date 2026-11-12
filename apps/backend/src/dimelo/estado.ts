// Dímelo Redes (RED-18): cuándo se exige el state de la entrada (el nonce de la cookie oauth_state). Postiz se lo
// salta si llega redirect_uri (lo manda su app móvil, que no guarda cookies). Dímelo Redes no tiene app móvil y la
// entrada es siempre por Mi Dímelo (GENERIC): ahí se exige siempre.
// Sin dependencias para poder probarlo con node --test (estado.spec.ts).
export function exigeEstado(provider: string, redirectUri?: string): boolean {
  return !redirectUri || String(provider).toUpperCase() === 'GENERIC';
}
