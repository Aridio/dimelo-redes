# Dímelo Redes

Dímelo Redes es [Postiz](https://github.com/gitroomhq/postiz-app) con la marca de [Dímelo Web](https://dimeloweb.com). Este repositorio es público porque Postiz tiene licencia AGPL-3.0: quien usa la herramienta puede ver y descargar el código que la hace funcionar. La licencia original está en [LICENSE](LICENSE), sin cambios.

- Rama `dimelo`: el código de Postiz de la etiqueta indicada abajo, sin tocar, más la carpeta `marca/`, este archivo y el workflow `.github/workflows/dimelo-redes.yml`.
- La marca **no** está escrita en el código de Postiz: la pone `marca/aplicar.sh` al construir. Así, pasar a una versión nueva de Postiz es volver a ponerla sobre esa versión.
- Imagen: `ghcr.io/aridio/dimelo-redes:<versión de Postiz>-dw<N>` (solo amd64).

| Versión | Postiz | Imagen |
|---|---|---|
| dw1 | v2.25.1 (`91c91f6`) | `ghcr.io/aridio/dimelo-redes:v2.25.1-dw1` |
| dw2 | v2.25.1 (`91c91f6`) | `ghcr.io/aridio/dimelo-redes:v2.25.1-dw2` (más textos en español, nombres de redes; solo español, sin selector de idioma) |
| dw3 | v2.25.1 (`91c91f6`) | `ghcr.io/aridio/dimelo-redes:v2.25.1-dw3` (menú lateral en un solo bloque, sin globos que repiten el texto; Configuración y Analíticas sin cosas apretadas en celular) |
| dw4 | v2.25.1 (`91c91f6`) | `ghcr.io/aridio/dimelo-redes:v2.25.1-dw4` (entrar con Mi Dímelo: `/auth/dimelo`, el espacio del negocio se crea la primera vez sin formulario, sesión de un día) |
| dw5 | v2.25.1 (`91c91f6`) | `ghcr.io/aridio/dimelo-redes:v2.25.1-dw5` (vuelve el fondo de Postiz; separación entre menú y contenido igual a la del borde) |
| dw6 | v2.25.1 (`91c91f6`) | `ghcr.io/aridio/dimelo-redes:v2.25.1-dw6` (métricas de Analíticas en español en todas las redes; sin número de versión a la vista; títulos de pestaña como el menú; 12:00 AM y fechas día/mes/año; nombre de archivo legible en Medios; vista previa de video que cabe; «Complementos» y «Plantillas»; botón de comentario en rojo de la marca) |
| dw10 | v2.25.1 (`91c91f6`) | `ghcr.io/aridio/dimelo-redes:v2.25.1-dw10` (para publicar desde el chat del cliente, spec 050 de dimelo-web-admin: `POST /dimelo/clave-espacio` para el panel y `PUT /public/v1/posts/group/:group` para editar una publicación que aún no salió) |
| dw11 | v2.25.1 (`91c91f6`) | `ghcr.io/aridio/dimelo-redes:v2.25.1-dw11` (entrar desde Mi Dímelo borra la sesión anterior en todas sus variantes: al recargar no vuelve otro negocio; abajo del menú, «Volver a Mi Dímelo» y quién está conectado) |
| dw12 | v2.25.1 (`91c91f6`) | `ghcr.io/aridio/dimelo-redes:v2.25.1-dw12` (sobre dw10, sin dw11; para la verificación de Google y Meta: al desconectar una red se borran sus llaves; cada 6 h se borran las de canales borrados o sin acceso desde hace 7 días, y los conectados a medias desde hace 7 días quedan sin llaves y con «Reconectar» (o se borran si nunca terminaron de conectar); YouTube pide solo 5 permisos) |
| dw13 | v2.25.1 (`91c91f6`) | `ghcr.io/aridio/dimelo-redes:v2.25.1-dw13` (dw11 y dw12 juntas) |
| dw14 | v2.25.1 (`91c91f6`) | `ghcr.io/aridio/dimelo-redes:v2.25.1-dw14` (sobre dw13: la entrada solo con «Iniciar sesión con Mi Dímelo», «Código fuente» al pie; registro, recuperar clave y activar llevan a la entrada; reconectar un canal pasa sus llaves de renovación nuevas) |

## Qué cambia

| Qué | Dónde |
|---|---|
| Logos e iconos (pestaña, menú, entrada, vista previa, «añadir a pantalla de inicio») | `marca/public/` y `marca/archivos/` (generados con `marca/generar/`) |
| Título, icono y tarjeta de enlace compartido | `marca/archivos/.../components/marca/metadatos.ts` |
| Títulos de pestaña y textos concretos, en español | `marca/textos.tsv` |
| «Postiz»/«Gitroom» que quede → «Dímelo Redes»; enlaces a postiz.com y docs.postiz.com → dimeloweb.com | `marca/aplicar.sh` § Reglas generales |
| Secciones ocultas: agente, API pública, MCP, CLI, apps de desarrolladores, webhooks, facturación, afiliados, extensión del navegador | `marca/ocultar.txt` y `marca/aplicar.sh` § Ocultar a mano |
| Botones y acentos en guayaba en vez del morado de Postiz | `marca/aplicar.sh` § Colores |
| Solo español, por defecto y sin selector (inglés y francés, más adelante) | `marca/aplicar.sh` § Idioma |
| Textos en español que faltaban en la traducción de Postiz, correos y avisos del servidor | `marca/es.json` y `marca/textos.tsv` |
| Nombres de las métricas de Analíticas en español (todas las redes) | `marca/archivos/libraries/nestjs-libraries/src/marca/metricas.ts` y `marca/aplicar.sh` § 10 |
| dw10: clave del espacio para el panel de Dímelo Web (solo con `DIMELO_PANEL_SECRET`; sin ella, 404) y editar publicaciones por la API pública | `apps/backend/src/dimelo/dw10.ts` (reglas y pruebas `dw10.spec.ts`), `apps/backend/src/api/routes/dimelo.controller.ts`, `public.integrations.controller.ts` (`PUT /posts/group/:group`), `organization.repository.ts` (`getApiKeyOfGenericOwner`) |
| Pantalla de entrada con frase propia (sin testimonios de Postiz) y bienvenida solo con «Conectar canales» | `marca/aplicar.sh` § Ocultar a mano |
| Ajustes visuales: separación entre menú y contenido igual a la del borde, menú más ancho, sin globo en botones con texto, filas de Configuración y Analíticas sin aplastarse en celular | `marca/aplicar.sh` § Ajustes visuales |
| Entrar con Mi Dímelo (acceso propio `GENERIC`; spec 039 de dimelo-web-admin) | `marca/archivos/.../app/(app)/auth/dimelo/page.tsx` y `marca/aplicar.sh` § 9 |
| dw11: quién está conectado (negocio y persona) y «Volver a Mi Dímelo» (o a DWA para el equipo) abajo del menú; borrar la sesión anterior también la de solo esta dirección | `apps/backend/src/dimelo/dw11.ts` (pruebas `dw11.spec.ts`), `marca/archivos/.../components/marca/conectado.tsx` y `marca/aplicar.sh` § 9 y § 11 |
| dw12: llaves fuera al desconectar y limpieza cada 6 h; YouTube con 5 permisos | `apps/backend/src/dimelo/dw12.ts` (pruebas `dw12.spec.ts`), `dw12.limpieza.ts` (en `api.module.ts`), `integration.repository.ts` (`deleteChannel`), `youtube.provider.ts` (`scopes`) |
| dw14: entrada solo con Mi Dímelo; reconectar un canal con sus llaves nuevas | `marca/archivos/.../components/marca/entrar.tsx`, `marca/aplicar.sh` § 4 y § 12 (y `textos.tsv`), `integration.service.ts` (`saveProviderPage`) |
| Página 404 y página de error propias | `marca/archivos/.../app/(app)/not-found.tsx`, `marca/archivos/.../app/global-error.tsx` |
| Enlace «Código fuente» a este repositorio (entrada y Ajustes) | `marca/archivos/.../components/marca/codigo.fuente.tsx` |

Lo que el cliente no ve (paquetes `@gitroom/…`, variables `POSTIZ_…`, carpetas) se queda como está.

Además, al instalar: `EMAIL_FROM_NAME=Dímelo Redes` y, para quitar del todo redes que no se ofrecen, la variable `HIDDEN_PROVIDERS` de Postiz (lista separada por comas).

## Probar en local

Hace falta Docker. Desde la raíz del repositorio, sobre una copia limpia:

```bash
marca/aplicar.sh && marca/comprobar.sh
docker build -f Dockerfile.dev -t dimelo-redes:prueba --build-arg NEXT_PUBLIC_VERSION=v2.25.1-dw1 .
docker compose -f marca/prueba/docker-compose.yml up -d     # base vacía en http://localhost:4007
marca/comprobar.sh http://localhost:4007
docker compose -f marca/prueba/docker-compose.yml down -v   # borra la prueba
git checkout -- . && git clean -fd apps libraries           # vuelve a la copia limpia
```

## Pasar a una versión nueva de Postiz

1. Traer la etiqueta nueva y la actual: `git fetch https://github.com/gitroomhq/postiz-app.git tag vX.Y.Z tag v2.25.1`.
2. Rama nueva desde ella y llevar encima los commits de la marca: `git checkout -b dimelo-vX.Y.Z vX.Y.Z && git cherry-pick <commits de dimelo que no son de Postiz>` (o `git rebase --onto vX.Y.Z v2.25.1 dimelo`). Solo tocan `marca/`, `LEEME-DIMELO.md` y `.github/workflows/`. Si Postiz cambió alguno de sus workflows, git avisa de un choque «modify/delete»: se resuelve con `git rm .github/workflows/<ese archivo>` y `git rebase --continue` (o `git cherry-pick --continue`).
3. `marca/aplicar.sh`. Si dice «no encontré …», Postiz movió o cambió ese texto: buscarlo en la versión nueva y corregir la línea en `textos.tsv`, `ocultar.txt` o `aplicar.sh`.
4. `marca/comprobar.sh` hasta «0 restos de Postiz». Si aparece un texto nuevo de Postiz, añadirlo a `textos.tsv` (si hay que decirlo distinto) o dejar que lo cambie la regla general.
5. Probar en local (arriba) y recorrer las pantallas en celular, tablet y computadora, claro y oscuro.
6. Volver a la copia limpia, commit de los cambios de `marca/`, apuntar la versión en la tabla de arriba y pasar `dimelo` a la rama nueva.
7. Etiqueta `vX.Y.Z-dw1` (o subir el número `-dwN` si es la misma versión de Postiz con cambios de marca) y `git push origin dimelo vX.Y.Z-dw1`. El workflow construye, prueba y publica la imagen.
8. En el servidor se cambia la imagen a la etiqueta nueva, nunca a «latest».

Tras la primera publicación hay que hacer pública la imagen una vez, a mano (GitHub crea los paquetes privados): perfil → Packages → `dimelo-redes` → Package settings → Change visibility → Public. Las etiquetas nuevas heredan esa visibilidad. Para comprobarlo sin sesión: `docker manifest inspect ghcr.io/aridio/dimelo-redes:<etiqueta>`.

Cada construcción guarda las capturas del recorrido (celular, tablet y computadora, claro y oscuro) en la pestaña Actions, en «capturas-dimelo-redes». Lanzada a mano, solo construye y prueba; publica si se marca «publicar».

## Workflows de Postiz

En la rama `dimelo` se quitaron los workflows de Postiz (`.github/workflows/`, salvo `dimelo-redes.yml`): publicaban en la cuenta de Postiz al subir cualquier etiqueta.
