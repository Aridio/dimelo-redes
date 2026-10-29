// dw12 (verificación de Google y Meta; dimelo-web-admin deploy/postiz/verificaciones.md): las llaves de una red no se
// guardan más de lo necesario. Al desconectar se borran en el momento (integration.repository.ts, deleteChannel); esta
// limpieza repasa además, cada 6 horas, los canales ya borrados, los que llevan 7 días sin poder entrar (la persona
// quitó el acceso desde la red) y los que se quedaron 7 días conectados a medias. Sin decoradores ni alias para probarlo con `node --test --experimental-strip-types`
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

// Conectados a medias (no eligió canal o página, o la red pidió elegir de nuevo) desde hace DIAS_SIN_ACCESO días.
// Además de quitar las llaves se marcan para reconectar: sin eso, el canal se quedaría sin botón «Reconectar».
export function filtroAMedias(ahora: Date) {
  const limite = new Date(ahora.getTime() - DIAS_SIN_ACCESO * 24 * 60 * 60 * 1000);
  return {
    deletedAt: NADA,
    inBetweenSteps: true,
    updatedAt: { lt: limite },
    OR: [{ token: { not: '' } }, { refreshToken: { not: NADA } }],
  };
}

export const A_MEDIAS = { ...SIN_LLAVES, refreshNeeded: true };

// Los que nunca terminaron de conectar (la fila guarda la cuenta, no un canal: rootInternalId igual a internalId) no se
// pueden reconectar: se borran. Los que ya funcionaban (o sin rootInternalId, por si acaso) quedan para «Reconectar».
// Tumblr guarda el blog principal con el mismo id que la cuenta: también queda para «Reconectar».
type FilaAMedias = { id: string; internalId: string; rootInternalId: string | null; providerIdentifier: string };
export function repartirAMedias(filas: FilaAMedias[]) {
  const nuncaTerminados = filas.filter((f) => f.rootInternalId === f.internalId && f.providerIdentifier !== 'tumblr').map((f) => f.id);
  const paraReconectar = filas.filter((f) => !nuncaTerminados.includes(f.id)).map((f) => f.id);
  return { nuncaTerminados, paraReconectar };
}
