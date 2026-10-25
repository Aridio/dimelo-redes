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
find apps/frontend/src libraries/react-shared-libraries/src -type f \
  \( -name '*.ts' -o -name '*.tsx' -o -name '*.scss' -o -name '*.css' \) -print0 |
  xargs -0 perl -i -pe '
    s{#(612bd3|612ad5|622aff|622ff6|7236f1|8155dd|7950f2|832ad5|8b5cf6)\b}{#c62f47}gi;
    s{%23(612bd3|612ad5)}{%23c62f47}gi;
    s{#(5520cb|7640e0|3900b2|7c3aff|9d6eff)\b}{#ad2840}gi;
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

if [ "$FALLOS" -gt 0 ]; then
  echo "La marca NO quedó aplicada: $FALLOS cambio(s) fallaron (arriba). Corrige textos.tsv, ocultar.txt o aplicar.sh." >&2
  exit 1
fi
echo "Marca de Dímelo Redes aplicada. Siguiente: marca/comprobar.sh"
