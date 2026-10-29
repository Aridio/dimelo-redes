import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { A_MEDIAS, CADA_MS, SIN_LLAVES, filtroAMedias, filtroLimpieza, repartirAMedias } from '@gitroom/backend/dimelo/dw12';

// dw12: borra las llaves de canales borrados, sin acceso o a medias desde hace 7 días (reglas en dw12.ts).
@Injectable()
export class LimpiezaLlaves implements OnModuleInit, OnModuleDestroy {
  private readonly _log = new Logger('LimpiezaLlaves');
  private _reloj?: NodeJS.Timeout;
  private _inicio?: NodeJS.Timeout;

  constructor(private _integration: PrismaRepository<'integration'>) {}

  onModuleInit() {
    this._inicio = setTimeout(() => this.limpiar(), 60 * 1000);
    this._reloj = setInterval(() => this.limpiar(), CADA_MS);
  }

  onModuleDestroy() {
    clearTimeout(this._inicio);
    clearInterval(this._reloj);
  }

  async limpiar() {
    try {
      const ahora = new Date();
      const borrados = await this._integration.model.integration.updateMany({
        where: filtroLimpieza(ahora),
        data: { ...SIN_LLAVES },
      });
      const filas = await this._integration.model.integration.findMany({
        where: filtroAMedias(ahora),
        select: { id: true, internalId: true, rootInternalId: true, providerIdentifier: true },
      });
      const { nuncaTerminados, paraReconectar } = repartirAMedias(filas);
      const sinTerminar = nuncaTerminados.length
        ? await this._integration.model.integration.updateMany({
            where: { id: { in: nuncaTerminados } },
            data: { ...SIN_LLAVES, deletedAt: ahora },
          })
        : { count: 0 };
      const aMedias = paraReconectar.length
        ? await this._integration.model.integration.updateMany({
            where: { id: { in: paraReconectar } },
            data: { ...A_MEDIAS },
          })
        : { count: 0 };
      const count = borrados.count + sinTerminar.count + aMedias.count;
      if (count) this._log.log(`llaves borradas de ${count} canal(es)`);
    } catch (err) {
      this._log.error(`no se pudieron borrar llaves: ${(err as Error).message}`);
    }
  }
}
