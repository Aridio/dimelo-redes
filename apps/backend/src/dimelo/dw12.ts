// dw12 (verificación de Google y Meta; dimelo-web-admin deploy/postiz/verificaciones.md): las llaves de una red no se
// guardan más de lo necesario. Al desconectar se borran en el momento (integration.repository.ts, deleteChannel); esta
// limpieza repasa además, cada 6 horas, los canales ya borrados y los que llevan 7 días sin poder entrar (la persona
// quitó el acceso desde la red). Sin decoradores ni alias para probarlo con `node --test --experimental-strip-types`
// (apps/backend/src/dimelo/dw12.spec.ts).

const NADA: null = null;
export const SIN_LLAVES = { token: '', refreshToken: NADA, tokenExpiration: NADA };

export const DIAS_SIN_ACCESO = 7;
export const CADA_MS = 6 * 60 * 60 * 1000;

// Canales con llaves que ya no deben tenerlas: borrados, o sin poder entrar desde hace DIAS_SIN_ACCESO días.
export function filtroLimpieza(ahora: Date) {
  const limite = new Date(ahora.getTime() - DIAS_SIN_ACCESO * 24 * 60 * 60 * 1000);
  return {
    OR: [{ token: { not: '' } }, { refreshToken: { not: NADA } }],
    AND: [
      {
        OR: [{ deletedAt: { not: NADA } }, { refreshNeeded: true, updatedAt: { lt: limite } }],
      },
    ],
  };
}
