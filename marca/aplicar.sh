#!/usr/bin/env bash
# Pone la marca de Dímelo Redes sobre el código de Postiz (ver LEEME-DIMELO.md).
# Uso: marca/aplicar.sh   (desde cualquier carpeta; trabaja sobre el repositorio donde está)
# Se pasa sobre el código tal como viene de Postiz. Si algo de lo que busca ya no está, para y dice qué,
# para corregir textos.tsv u ocultar.txt al actualizar de versión. Después: marca/comprobar.sh.
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
MARCA="$RAIZ/marca"
cd "$RAIZ"

if [ -e apps/frontend/src/components/marca/codigo.fuente.tsx ]; then
  echo "La marca ya está aplicada en esta copia. Parte de una copia limpia (git checkout -- . && git clean -fd apps libraries)." >&2
  exit 1
fi

FALLOS=0
fallo() { echo "FALLO: $*" >&2; FALLOS=$((FALLOS + 1)); }

# Cambia en un archivo el texto literal VIEJO por NUEVO (todas las veces). Falla si VIEJO no está.
literal() {
  local archivo="$1" viejo="$2" nuevo="$3"
  [ -f "$archivo" ] || { fallo "no existe $archivo"; return; }
  VIEJO="$viejo" NUEVO="$nuevo" perl -0777 -i -pe '
    BEGIN { $v = $ENV{VIEJO}; $n = $ENV{NUEVO}; }
    $c += s/\Q$v\E/$n/g;
    END { exit($c ? 0 : 3); }' "$archivo" || fallo "no encontré «$viejo» en $archivo"
}

# Aplica una expresión de perl (s/…/…/) a un archivo. Falla si no cambia nada.
patron() {
  local archivo="$1" expr="$2"
  [ -f "$archivo" ] || { fallo "no existe $archivo"; return; }
  EXPR="$expr" perl -0777 -i -pe '
    BEGIN { $e = $ENV{EXPR}; }
    $c += eval $e; die $@ if $@;
    END { exit($c ? 0 : 3); }' "$archivo" || fallo "el cambio «$expr» no encontró nada en $archivo"
}

FRONT=apps/frontend/src

# 1. Logos e iconos ----------------------------------------------------------------------------------
cp "$MARCA"/public/* apps/frontend/public/
# Archivos nuevos o sustituidos enteros (logo del menú, logo de la entrada, enlace al código, 404)
cp -R "$MARCA"/archivos/. "$RAIZ"/

# Vista previa pública: el nombre en vez del logo de Postiz dibujado en el código
patron "$FRONT/app/(app)/(preview)/p/[id]/page.tsx" \
  's{<svg\s+width="64"\s+height="60"\s+viewBox="0 0 366 167".*?</svg>}{<span className="text-[18px] font-[600]">Dímelo Redes</span>}s'

# Título, icono y tarjeta de enlace por defecto (pestaña, WhatsApp, «añadir a pantalla de inicio»)
for layout in "$FRONT/app/(app)/layout.tsx" "$FRONT/app/(provider)/layout.tsx"; do
  patron "$layout" 's{\n(export default async function AppLayout)}{\nimport { metadatosDimelo } from \x27\@gitroom/frontend/components/marca/metadatos\x27;\nexport const generateMetadata = metadatosDimelo;\n\n$1}'
done

# 2. Textos literales (textos.tsv) ---------------------------------------------------------------------
while IFS=$'\t' read -r archivo viejo nuevo; do
  case "$archivo" in ''|'#'*) continue ;; esac
  literal "$archivo" "$viejo" "$nuevo"
done < "$MARCA/textos.tsv"

# Idioma: solo español, también por defecto; sin selector de idioma (Aridio, 2026-10-25; inglés y francés, más adelante)
patron libraries/react-shared-libraries/src/translation/i18n.config.ts 's{export const fallbackLng = \x27en\x27;}{export const fallbackLng = \x27es\x27;}'
patron libraries/react-shared-libraries/src/translation/i18n.config.ts 's{export const languages = \[.*?\];}{export const languages = [fallbackLng];}s'
patron "$FRONT/components/new-layout/layout.component.tsx" 's{<div className="w-\[1px\] h-\[20px\] bg-blockSeparator mobile:hidden" />\s*<LanguageComponent />}{{/* Dímelo Redes: solo español */}}'

# 3. Ocultar (ocultar.txt) -----------------------------------------------------------------------------
AJUSTES=()
RUTAS=()
while read -r tipo valor; do
  case "$tipo" in
    ''|'#'*) continue ;;
    menu) literal "$FRONT/components/layout/top.menu.tsx" "path: '$valor'," "path: '$valor',
      hide: true," ;;
    ajuste) AJUSTES+=("'$valor'") ;;
    ruta) RUTAS+=("'$valor'") ;;
    *) fallo "tipo desconocido en ocultar.txt: $tipo" ;;
  esac
done < "$MARCA/ocultar.txt"

if [ ${#AJUSTES[@]} -gt 0 ]; then
  LISTA="$(IFS=,; echo "${AJUSTES[*]}")"
  literal "$FRONT/components/layout/settings.component.tsx" "    return arr;" \
    "    // Dímelo Redes: pestañas ocultas (marca/ocultar.txt)
    return arr.filter((p) => ![$LISTA].includes(p.tab));"
fi
if [ ${#RUTAS[@]} -gt 0 ]; then
  LISTA="$(IFS=,; echo "${RUTAS[*]}")"
  literal "$FRONT/proxy.ts" "  const nextUrl = request.nextUrl;" \
    "  const nextUrl = request.nextUrl;
  // Dímelo Redes: secciones ocultas (marca/ocultar.txt) vuelven al calendario
  if (
    [$LISTA].some(
      (r) => nextUrl.pathname === r || nextUrl.pathname.startsWith(r + '/')
    )
  ) {
    return NextResponse.redirect(new URL('/launches', nextUrl.href));
  }"
fi

# 4. Ocultar a mano --------------------------------------------------------------------------------------
# Bienvenida: solo el paso «Conectar canales» (los otros enseñan el agente, MCP, CLI y un video de Postiz)
O="$FRONT/components/onboarding/onboarding.modal.tsx"
patron "$O" 's{\n\s*t\(\x27connect_agents\x27, \x27Connect Agents\x27\),\n\s*t\(\x27watch_tutorial\x27, \x27Watch Tutorial\x27\),}{}'
patron "$O" 's{onNext=\{\(\) => setStep\(2\)\}\s*onSkip=\{\(\) => setStep\(2\)\}}{onNext={onClose}\n                onSkip={onClose}}'

# Canales que necesitan la extensión del navegador de Postiz
patron libraries/nestjs-libraries/src/integrations/integration.manager.ts \
  's{\.filter\(\(p\) => !this\.isHiddenProvider\(p\.identifier\)\)}{.filter((p) => !this.isHiddenProvider(p.identifier) && !p.isChromeExtension)}'

# Icono de la extensión del navegador en la barra de arriba
literal "$FRONT/components/new-layout/layout.component.tsx" "<ChromeExtensionComponent />" "{/* Dímelo Redes: sin extensión del navegador */}"

# Pantalla de entrada: frase propia en vez de «20.000 emprendedores usan Postiz» y testimonios de Postiz,
# y enlace al código fuente bajo el formulario
A="$FRONT/app/(app)/auth/layout.tsx"
patron "$A" 's{<div className="text-center">\s*Over .*?<TestimonialComponent />}{<div className="text-center max-w-[520px] leading-[1.25]">\n            Programa y publica en tus redes\n            <br />\n            <span className="text-[#ff7a8c]">desde un solo lugar</span>\n          </div>}s'
patron "$A" 's{(<div className="flex">\{children\}</div>)}{$1\n            <div className="flex justify-center">\n              <CodigoFuente />\n            </div>}'
patron "$A" 's{^}{import { CodigoFuente } from \x27\@gitroom/frontend/components/marca/codigo.fuente\x27;\n}'

# Ajustes: enlace al código fuente al pie de la lista de pestañas
S="$FRONT/components/layout/settings.component.tsx"
patron "$S" 's{(<LogoutComponent />\s*</div>\s*\)\})}{$1\n          <div className="mt-4 mobile:mt-[8px]">\n            <CodigoFuente />\n          </div>}'
patron "$S" 's{^(\x27use client\x27;\n)}{$1import { CodigoFuente } from \x27\@gitroom/frontend/components/marca/codigo.fuente\x27;\n}'

# Correo de cambio de acceso (solo administradores)
patron libraries/nestjs-libraries/src/database/prisma/users/users.service.ts \
  's{`An administrator changed the login for your Postiz account\. ` \+.*?separately from your billing settings\.`}{`Un administrador cambió el acceso a tu cuenta de Dímelo Redes. Ahora entras con \${account.email}. Tu plan no cambió.`}s'

# 5. Reglas generales ----------------------------------------------------------------------------------
# Sobre todo el código que llega a la pantalla, a los correos o a las redes (también lo oculto, por si vuelve
# a aparecer en otra versión): nombre, enlaces y direcciones de Postiz.
ALCANCE=(apps/frontend/src libraries/react-shared-libraries/src libraries/nestjs-libraries/src
         libraries/helpers/src apps/backend/src apps/orchestrator/src)
find "${ALCANCE[@]}" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.json' -o -name '*.html' \) -print0 |
  xargs -0 perl -i -pe '
    s{isGeneral(ServerSide\(\))? \? \x27Postiz\x27 : \x27Gitroom\x27}{\x27Dímelo Redes\x27}g;
    s{\x27Postiz/1\.0 \(\+https://postiz\.com\)\x27}{\x27DimeloRedes/1.0 (+https://dimeloweb.com)\x27}g;
    s{https://(docs|affiliate)\.postiz\.com[^\s\x27"`)<\$\{]*}{https://dimeloweb.com}g;
    s{https://(www\.)?postiz\.com[^\s\x27"`)<\$\{]*}{https://dimeloweb.com}g;
    s{https://chromewebstore\.google\.com/detail/postiz/[^\s\x27"`)<\$\{]*}{https://dimeloweb.com}g;
    s{https://uploads\.gitroom\.com/[^\s\x27"`)<\$\{]*}{https://dimeloweb.com/favicon.svg}g;
    s{https://github\.com/gitroomhq/postiz-app}{https://github.com/Aridio/dimelo-redes}g;
    s{\@postiz\.com}{\@sin-correo.dimeloweb.com}g;
    s{postiz\.example\.com}{redes.example.com}g;
    s{(["\x27])(postiz\.com|postiz\.pro|gitroom\.com)\1}{$1dimeloweb.com$1}g;
    s{\bpostiz\.com\b}{dimeloweb.com}g;
    s{MyPostizAgent}{MiAgenteDeRedes}g;
    s{#Postiz\b}{#DimeloRedes}g;
    s{\bPostiz\b}{Dímelo Redes}g;
    s{\bGitroom\b}{Dímelo Redes}g;
  '

# 6. Colores: el morado de Postiz pasa a guayaba (DESIGN.md de dimeloweb.com) ---------------------------
{ find apps/frontend/src libraries/react-shared-libraries/src -type f \
    \( -name '*.ts' -o -name '*.tsx' -o -name '*.scss' -o -name '*.css' \) -print0
  find apps/frontend/public -name '*.svg' -not -path '*/icons/*' -print0; } |
  xargs -0 perl -i -pe '
    s{#(612bd3|612ad5|622aff|622ff6|7236f1|8155dd|7950f2|832ad5|8b5cf6|d82d7e)\b}{#c62f47}gi;
    s{%23(612bd3|612ad5)}{%23c62f47}gi;
    s{#(5520cb|7640e0|3900b2|7c3aff|9d6eff|5023b8|5720cb|5826c2)\b}{#ad2840}gi;
    s{#(662fda|8c66ff|6c63ff)\b}{#c62f47}gi;
    s{#(ae8afc|b69dec|cebdf2)\b}{#ff7a8c}gi;
    s{#291259\b}{#2b1519}gi;
    s{#e7ddfe\b}{#ffe8eb}gi;
    s{#dacbfb\b}{#ffd1d8}gi;
    s{rgba\(55, 37, 97,}{rgba(43, 21, 25,}g;
    s{\b(shadow|bg|text|border|ring|from|to)-(purple|violet|indigo)-([0-9]+)}{$1-rose-$3}g;
    s{#ebe8ff\b}{#ffe8eb}gi;
    s{#2d1b57\b}{#2b1519}gi;
    s{#fc69ff\b}{#ff7a8c}gi;
    s{rgba?\(\s*97,\s*43,\s*211}{rgba(198, 47, 71}g;
  '

# 7. Textos en español que faltan en la traducción de Postiz (marca/es.json) ----------------------------
python3 -I - "$MARCA/es.json" libraries/react-shared-libraries/src/translation/locales/es/translation.json <<'PY' || fallo "no pude mezclar marca/es.json"
import json, sys
nuevos = json.load(open(sys.argv[1], encoding="utf-8")); nuevos.pop("_nota", None)
ruta = sys.argv[2]; actual = json.load(open(ruta, encoding="utf-8"))
actual.update(nuevos)
open(ruta, "w", encoding="utf-8").write(json.dumps(actual, ensure_ascii=False, indent=2) + "\n")
PY

# 8. Ajustes visuales (Aridio, 2026-10-27) ---------------------------------------------------------------
L="$FRONT/components/new-layout/layout.component.tsx"
# Separación entre menú y contenido igual a la del borde de la ventana (12 px); el fondo se queda como en Postiz
literal "$L" '<div className="flex-1 flex gap-[8px] mobile:gap-0">' '<div className="flex-1 flex gap-[12px] mobile:gap-0">'
# Menú más ancho para que «Configuración» y el botón activo quepan dentro sin salirse hacia el contenido
literal "$L" "'flex flex-col bg-newBgColorInner w-[80px] rounded-[12px]" "'flex flex-col bg-newBgColorInner w-[96px] rounded-[12px]"
literal "$L" "'fixed h-full w-[64px] start-[20px]" "'fixed h-full w-[80px] start-[20px]"
# Botones del menú: sin globo que repite el texto que ya se ve
M="$FRONT/components/new-layout/menu-item.tsx"
patron "$M" 's{\s+title=\{label\}}{}g'
literal "$M" "py-[8px] px-[6px]" "py-[8px] px-[4px]"

# Configuración en celular y tablet: interruptores y botones sin aplastarse; enlaces cortos en columna
for f in "$FRONT/components/settings/email-notifications.component.tsx" "$FRONT/components/settings/delete-account.component.tsx"; do
  literal "$f" '<div className="flex items-center justify-between">' \
    '<div className="flex items-center justify-between gap-[16px] [&>*:last-child]:shrink-0">'
done
literal "$FRONT/components/settings/delete-account.component.tsx" 'className="!bg-red-800"' 'className="!bg-red-800 whitespace-nowrap"'
SL="$FRONT/components/settings/shortlink-preference.component.tsx"
literal "$SL" '<div className="flex items-center justify-between gap-[24px]">' \
  '<div className="flex items-center justify-between gap-[24px] mobile:flex-col mobile:items-stretch mobile:gap-[12px]">'
literal "$SL" '<div className="w-[200px]">' '<div className="w-[200px] shrink-0 mobile:w-full">'

# Analíticas sin canales: nombres de las redes como se ven al agregarlas y título que cabe en el celular
PA="$FRONT/components/platform-analytics/platform.analytics.tsx"
literal "$PA" "{t('supported', 'Supported:')}
          {allowedIntegrations.map((p) => capitalize(p)).join(', ')}" \
  "Funciona con Facebook, Instagram, Página de LinkedIn, TikTok, YouTube, Google Business, Pinterest, Threads y X."
literal "$PA" "import { capitalize, orderBy } from 'lodash';" "import { orderBy } from 'lodash';"
literal "$PA" '<div className="text-[48px]">' '<div className="text-[48px] mobile:text-[26px] leading-[1.2]">'
literal "$PA" '<div className="text-[20px]">' '<div className="text-[20px] mobile:text-[16px]">'

# 9. Entrar con Mi Dímelo (spec 039 de dimelo-web-admin, 2026-10-27) ------------------------------------------
# Mi Dímelo es el acceso propio (GENERIC) de Postiz: /auth/dimelo (marca/archivos) lanza el acceso; aquí, que esa página
# empiece sin la sesión anterior y que la primera entrada cree el espacio del negocio sin pedir «Empresa».
literal "$FRONT/proxy.ts" "  if (nextUrl.pathname.startsWith('/modal/') && !authCookie) {" \
"  // Dímelo Redes: entrar desde Mi Dímelo cierra la sesión anterior (puede ser de otro negocio). dw11: en todas sus
  // variantes. Con dos cookies del mismo nombre el navegador manda primero la más vieja y el servidor usa esa; por eso se
  // borran la del dominio (.dimeloweb.com, la que pone el servidor), la de solo esta dirección (la que pone el navegador)
  // y la de esta dirección con dominio.
  if (nextUrl.pathname === '/auth/dimelo') {
    let direccion = '';
    try {
      direccion = new URL(process.env.FRONTEND_URL!).hostname;
    } catch {
      direccion = '';
    }
    const variantes = [
      getCookieUrlFromDomain(process.env.FRONTEND_URL!),
      '',
      direccion,
    ].filter((dominio, i, todos) => todos.indexOf(dominio) === i);
    const seguro = !process.env.NOT_SECURED ? '; Secure' : '';
    for (const name of ['auth', 'showorg', 'impersonate']) {
      for (const dominio of variantes) {
        topResponse.headers.append(
          'Set-Cookie',
          \`\${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT\${dominio ? \`; Domain=\${dominio}\` : ''}\${seguro}\`
        );
      }
    }
    topResponse.headers.set('Cache-Control', 'no-store');
    return topResponse;
  }

  if (nextUrl.pathname.startsWith('/modal/') && !authCookie) {"
OP=apps/backend/src/services/auth/providers/oauth.provider.ts
literal "$OP" "async getUser(access_token: string): Promise<{ email: string; id: string }> {" \
  "async getUser(access_token: string): Promise<{ email: string; id: string; name?: string }> {"
literal "$OP" "    const { email, sub: id } = await response.json();
    return { email, id };" "    const { email, sub: id, name } = await response.json();
    return { email, id, name };"
AS=apps/backend/src/services/auth/auth.service.ts
literal "$AS" "    redirectUri?: string,
    state?: string,
    stateCookie?: string
  ) {" "    redirectUri?: string,
    state?: string,
    stateCookie?: string,
    ip?: string,
    userAgent?: string
  ) {"
literal "$AS" "    if (checkExists) {
      return { jwt: await this.jwt(checkExists) };
    }

    return { token };" "    if (checkExists) {
      return { jwt: await this.jwt(checkExists) };
    }

    // Dímelo Redes: la primera entrada con Mi Dímelo crea el espacio del negocio con su nombre, sin otro formulario
    if (provider === Provider.GENERIC) {
      const created = await this.loginOrRegisterProvider(
        Provider.GENERIC,
        {
          providerToken: token,
          company: (user as unknown as { name?: string }).name || user.email,
        } as unknown as CreateOrgUserDto,
        ip || '',
        userAgent || ''
      );
      return { jwt: await this.jwt(created) };
    }

    return { token };"
literal apps/backend/src/api/routes/auth.controller.ts "      state,
      req?.cookies?.oauth_state
    );" "      state,
      req?.cookies?.oauth_state,
      req.ip,
      String(req.headers['user-agent'] || '')
    );"

# La sesión que abre Mi Dímelo dura un día (no un año): quitar Dímelo Redes en DWA corta el acceso en menos de un día
patron apps/backend/src/api/routes/auth.controller.ts 's{(return response\.json\(\{ token \}\);.*?expires: new Date\(Date\.now\(\) \+ )1000 \* 60 \* 60 \* 24 \* 365}{${1}1000 * 60 * 60 * (provider.toUpperCase() === "GENERIC" ? 24 : 24 * 365)}s'
# Y la clave de esa sesión vence al día también en el servidor (aunque alguien la copie del navegador)
literal "$AS" "      delete user.password;
    }
    return AuthChecker.signJWT(user);" "      delete user.password;
    }
    if (user.providerName === Provider.GENERIC) {
      return AuthChecker.signJWT({
        ...user,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      });
    }
    return AuthChecker.signJWT(user);"
# Si el acceso con Mi Dímelo no se completa (código vencido), a la entrada en vez de «cargando» sin fin
literal "$FRONT/components/auth/register.tsx" "    const { token } = await (
      await fetch(\`/auth/oauth/\${provider?.toUpperCase() || 'LOCAL'}/exists\`, {
        method: 'POST',
        body: JSON.stringify({
          code,
          state,
        }),
      })
    ).json();" "    const res = await fetch(\`/auth/oauth/\${provider?.toUpperCase() || 'LOCAL'}/exists\`, {
      method: 'POST',
      body: JSON.stringify({
        code,
        state,
      }),
    });
    if (!res.ok) {
      window.location.href = '/auth/login';
      return;
    }
    const { token } = await res.json();"

# 10. Detalles de dw6 (Aridio, 2026-10-27) -----------------------------------------------------------------------
# Analíticas: nombres de las métricas en español para todas las redes (marca/archivos/.../marca/metricas.ts),
# también para lo que ya estaba guardado en la memoria intermedia
IS=libraries/nestjs-libraries/src/database/prisma/integrations/integration.service.ts
literal "$IS" "      return JSON.parse(getIntegrationData);" "      return traducirMetricas(JSON.parse(getIntegrationData));"
literal "$IS" "        return loadAnalytics;" "        return traducirMetricas(loadAnalytics);"
patron "$IS" 's{^}{import { traducirMetricas } from \x27\@gitroom/nestjs-libraries/marca/metricas\x27;\n}'
PS=libraries/nestjs-libraries/src/database/prisma/posts/posts.service.ts
literal "$PS" "      return loadAnalytics;" "      return traducirMetricas(loadAnalytics);"
patron "$PS" 's{^}{import { traducirMetricas } from \x27\@gitroom/nestjs-libraries/marca/metricas\x27;\n}'

# Calendario: sin el número de versión bajo la lista de canales
patron "$FRONT/components/launches/launches.component.tsx" \
  's{\s*<div>\s*\{process\.env\.NEXT_PUBLIC_VERSION\s*\?\s*process\.env\.NEXT_PUBLIC_VERSION\s*:\s*\x27\x27\}\s*</div>}{}'

# Medios y Biblioteca de medios: el nombre del archivo sobre una franja oscura que se lee en cualquier miniatura
MC="$FRONT/components/media/media.component.tsx"
literal "$MC" "'absolute bottom-[10px] start-[10px] end-[10px] z-[100] truncate text-end mobile:text-[12px]'," \
  "'absolute bottom-[6px] start-[6px] end-[6px] z-[100] truncate text-start text-[12px] leading-[18px] text-white bg-black/70 rounded-[4px] px-[6px] pointer-events-none',"
# Vista previa a pantalla completa: el video o la imagen caben en el alto de la ventana, con controles en el video
patron "$MC" 's~<div className="w-full h-full p-\[50px\]">\s*\{hasExtension\(media\.path, \x27mp4\x27\) \? \(\s*<VideoFrame\s*autoplay=\{true\}\s*url=\{mediaDirectory\.set\(media\.path\)\}\s*/>\s*\) : \(\s*<img\s*width="100%"\s*height="100%"\s*className="w-full h-full max-h-\[100%\] max-w-\[100%\] object-cover"~<div className="w-full h-full p-[50px] mobile:p-[12px] flex justify-center items-center">\n            {hasExtension(media.path, \x27mp4\x27) ? (\n              <video\n                className="block max-w-full max-h-[calc(100vh-180px)] rounded-[4px]"\n                src={mediaDirectory.set(media.path)}\n                autoPlay\n                controls\n              />\n            ) : (\n              <img\n                className="block max-w-full max-h-[calc(100vh-180px)] object-contain"~s'

# 11. Quién está conectado y «Volver a Mi Dímelo» (dw11, spec 039 de dimelo-web-admin) -----------------------------
# Mi Dímelo manda quién entra, si es del equipo y adónde volver (apps/backend/src/dimelo/dw11.ts). Va en la sesión,
# no en el usuario del negocio (lo comparten varias personas). /user/self lo devuelve con el nombre del espacio y el
# menú lateral lo pinta abajo (marca/archivos/.../components/marca/conectado.tsx).
literal "$OP" "async getUser(access_token: string): Promise<{ email: string; id: string; name?: string }> {" \
  "async getUser(access_token: string): Promise<{ email: string; id: string; name?: string; dimelo?: unknown }> {"
literal "$OP" "    const { email, sub: id, name } = await response.json();
    return { email, id, name };" "    const { email, sub: id, name, dimelo_persona, dimelo_equipo, dimelo_volver } = await response.json();
    return { email, id, name, dimelo: { persona: dimelo_persona, equipo: dimelo_equipo, volver: dimelo_volver } };"
literal "$AS" "    if (checkExists) {
      return { jwt: await this.jwt(checkExists) };
    }" "    if (checkExists) {
      return { jwt: await this.jwt(checkExists, (user as unknown as { dimelo?: unknown }).dimelo) };
    }"
literal "$AS" "      return { jwt: await this.jwt(created) };" \
  "      return { jwt: await this.jwt(created, (user as unknown as { dimelo?: unknown }).dimelo) };"
literal "$AS" "  private async jwt(user: User) {" "  private async jwt(user: User, dimelo?: unknown) {"
literal "$AS" "      return AuthChecker.signJWT({
        ...user,
        exp:" "      return AuthChecker.signJWT({
        ...user,
        dimelo: sesionDimelo(dimelo),
        exp:"
patron "$AS" 's{^}{import { sesionDimelo } from \x27\@gitroom/backend/dimelo/dw11\x27;\n}'
UC=apps/backend/src/api/routes/users.controller.ts
literal "$UC" "      admin: !!user.isSuperAdmin,
      impersonate: !!impersonate," "      admin: !!user.isSuperAdmin,
      impersonate: !!impersonate,
      // Con «impersonate» la sesión es de otra cuenta: no se mezcla
      ...(user.providerName === 'GENERIC' && !impersonate
        ? { dimelo: vistaDimelo(sesionDe(req), organization.name, process.env) }
        : {}),"
patron "$UC" 's{^}{import { vistaDimelo } from \x27\@gitroom/backend/dimelo/dw11\x27;\n// dw11: lo que Mi Dímelo puso en la sesión al entrar (la clave ya la comprobó el middleware)\nconst sesionDe = (req: Request): unknown => {\n  try {\n    const auth = String(req.headers.auth \|\| req.cookies.auth \|\| \x27\x27);\n    return (AuthChecker.verifyJWT(auth) as { dimelo?: unknown }).dimelo;\n  } catch {\n    return undefined;\n  }\n};\n}'
literal "$L" "                          <TopMenu />
                        </div>" "                          <TopMenu />
                          <DimeloConectado />
                        </div>"
patron "$L" 's{^(\x27use client\x27;\n)}{$1\nimport { DimeloConectado } from \x27\@gitroom/frontend/components/marca/conectado\x27;}'

if [ "$FALLOS" -gt 0 ]; then
  echo "La marca NO quedó aplicada: $FALLOS cambio(s) fallaron (arriba). Corrige textos.tsv, ocultar.txt o aplicar.sh." >&2
  exit 1
fi
echo "Marca de Dímelo Redes aplicada. Siguiente: marca/comprobar.sh"
