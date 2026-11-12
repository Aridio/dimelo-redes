// Dímelo Redes (RED-12): qué cuenta como sesión en el middleware. jsonwebtoken ya rechaza una clave vencida, pero
// acepta una sin exp; las de sesión siempre lo llevan (auth.service.ts jwt, marca/aplicar.sh § 9), las demás claves
// firmadas con el mismo secreto (cambiar la clave, activar la cuenta, invitaciones) no.
// Sin dependencias para poder probarlo con node --test (sesion.spec.ts).
export function sesionConVencimiento(payload: unknown): boolean {
  const exp = (payload as { exp?: unknown } | null)?.exp;
  return typeof exp === 'number' && Number.isFinite(exp) && exp > 0;
}
