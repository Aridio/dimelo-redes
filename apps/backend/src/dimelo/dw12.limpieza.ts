import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { CADA_MS, SIN_LLAVES, filtroLimpieza } from '@gitroom/backend/dimelo/dw12';

// dw12: borra las llaves de canales borrados o sin acceso desde hace 7 días (reglas en dw12.ts).
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
      const { count } = await this._integration.model.integration.updateMany({
        where: filtroLimpieza(new Date()),
        data: { ...SIN_LLAVES },
      });
      if (count) this._log.log(`llaves borradas de ${count} canal(es)`);
    } catch (err) {
      this._log.error(`no se pudieron borrar llaves: ${(err as Error).message}`);
    }
  }
}
