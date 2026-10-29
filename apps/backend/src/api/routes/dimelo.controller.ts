import { Body, Controller, Headers, HttpCode, HttpException, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { OrganizationService } from '@gitroom/nestjs-libraries/database/prisma/organizations/organization.service';
import {
  businessEmail,
  panelSecret,
  secretOk,
} from '@gitroom/backend/dimelo/dw10';

// dw10 (spec 050 de dimelo-web-admin): el panel de Dímelo Web pide la clave del espacio de un negocio para publicar
// desde el chat del cliente. Solo con la clave compartida DIMELO_PANEL_SECRET; sin ella la ruta no existe (404).
// Caddy no la publica hacia fuera: el panel la llama por la red interna del servidor.
@ApiExcludeController()
@Controller('/dimelo')
export class DimeloController {
  constructor(private _organizationService: OrganizationService) {}

  @Post('/clave-espacio')
  @HttpCode(200)
  async claveEspacio(
    @Headers('x-dimelo-panel') given: string,
    @Body() body: { correo?: string }
  ) {
    const secret = panelSecret(process.env);
    if (!secret) {
      throw new HttpException({ msg: 'Not found' }, 404);
    }
    if (!secretOk(given, secret)) {
      throw new HttpException({ msg: 'Unauthorized' }, 401);
    }
    const email = businessEmail(body?.correo);
    if (!email) {
      throw new HttpException({ msg: 'Invalid email' }, 400);
    }
    const apiKey = await this._organizationService.getApiKeyOfGenericOwner(email);
    if (!apiKey) {
      throw new HttpException({ msg: 'Not found' }, 404);
    }
    return { apiKey };
  }
}
