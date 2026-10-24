# Dímelo Redes

Dímelo Redes es [Postiz](https://github.com/gitroomhq/postiz-app) con la marca de [Dímelo Web](https://dimeloweb.com). Este repositorio es público porque Postiz tiene licencia AGPL-3.0: quien usa la herramienta puede ver y descargar el código que la hace funcionar. La licencia original está en [LICENSE](LICENSE), sin cambios.

- Rama `dimelo`: el código de Postiz de la etiqueta indicada abajo, sin tocar, más la carpeta `marca/`, este archivo y el workflow `.github/workflows/dimelo-redes.yml`.
- La marca **no** está escrita en el código de Postiz: la pone `marca/aplicar.sh` al construir. Así, pasar a una versión nueva de Postiz es volver a ponerla sobre esa versión.
- Imagen: `ghcr.io/aridio/dimelo-redes:<versión de Postiz>-dw<N>` (solo amd64).

| Versión | Postiz | Imagen |
|---|---|---|
| dw1 | v2.25.1 (`91c91f6`) | `ghcr.io/aridio/dimelo-redes:v2.25.1-dw1` |

## Qué cambia

| Qué | Dónde |
|---|---|
| Logos e iconos (pestaña, menú, entrada, vista previa, «añadir a pantalla de inicio») | `marca/public/` y `marca/archivos/` (generados con `marca/generar/`) |
| Título, icono y tarjeta de enlace compartido | `marca/archivos/.../components/marca/metadatos.ts` |
| Títulos de pestaña y textos concretos, en español | `marca/textos.tsv` |
| «Postiz»/«Gitroom» que quede → «Dímelo Redes»; enlaces a postiz.com y docs.postiz.com → dimeloweb.com | `marca/aplicar.sh` § Reglas generales |
| Secciones ocultas: agente, API pública, MCP, CLI, apps de desarrolladores, webhooks, facturación, afiliados, extensión del navegador | `marca/ocultar.txt` y `marca/aplicar.sh` § Ocultar a mano |
| Pantalla de entrada con frase propia (sin testimonios de Postiz) y bienvenida solo con «Conectar canales» | `marca/aplicar.sh` § Ocultar a mano |
| Página 404 propia | `marca/archivos/.../app/(app)/not-found.tsx` |
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

1. Traer la etiqueta nueva: `git fetch https://github.com/gitroomhq/postiz-app.git tag vX.Y.Z`.
2. Rama nueva desde ella y llevar encima los commits de la marca: `git checkout -b dimelo-vX.Y.Z vX.Y.Z && git cherry-pick <commits de dimelo que no son de Postiz>` (o `git rebase --onto vX.Y.Z v2.25.1 dimelo`). Solo tocan `marca/`, `LEEME-DIMELO.md` y `.github/workflows/`, así que no chocan.
3. `marca/aplicar.sh`. Si dice «no encontré …», Postiz movió o cambió ese texto: buscarlo en la versión nueva y corregir la línea en `textos.tsv`, `ocultar.txt` o `aplicar.sh`.
4. `marca/comprobar.sh` hasta «0 restos de Postiz». Si aparece un texto nuevo de Postiz, añadirlo a `textos.tsv` (si hay que decirlo distinto) o dejar que lo cambie la regla general.
5. Probar en local (arriba) y recorrer las pantallas en celular, tablet y computadora, claro y oscuro.
6. Volver a la copia limpia, commit de los cambios de `marca/`, apuntar la versión en la tabla de arriba y pasar `dimelo` a la rama nueva.
7. Etiqueta `vX.Y.Z-dw1` (o subir el número `-dwN` si es la misma versión de Postiz con cambios de marca) y `git push origin dimelo vX.Y.Z-dw1`. El workflow construye, prueba y publica la imagen.
8. En el servidor se cambia la imagen a la etiqueta nueva, nunca a «latest».

## Workflows de Postiz

En la rama `dimelo` se quitaron los workflows de Postiz (`.github/workflows/`, salvo `dimelo-redes.yml`): publicaban en la cuenta de Postiz al subir cualquier etiqueta.
