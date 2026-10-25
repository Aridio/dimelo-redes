#!/usr/bin/env bash
# Comprueba que no queda «Postiz» ni «Gitroom» a la vista después de marca/aplicar.sh.
# Uso: marca/comprobar.sh                 revisa el código
#      marca/comprobar.sh <dirección>     además revisa las páginas que sirve una copia en marcha
#                                         (p. ej. http://localhost:4007). Con la variable AUTH (valor de la
#                                         cookie «auth» de una cuenta de prueba) revisa también las pantallas
#                                         con sesión: calendario, ajustes, medios, estadísticas y la 404.
# Termina en 0 solo si no encuentra nada. Lo que el cliente no ve (nombres de paquetes @gitroom/…,
# variables POSTIZ_…, claves de traducción, carpetas) está permitido abajo, en PERMITIDO.
set -uo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ"
RESTOS=0
resto() { echo "RESTO: $*"; RESTOS=$((RESTOS + 1)); }

ALCANCE=(apps/frontend/src libraries/react-shared-libraries/src libraries/nestjs-libraries/src
         libraries/helpers/src apps/backend/src apps/orchestrator/src)

# Nombres internos que no llegan a la pantalla. Se borran de cada línea antes de buscar.
PERMITIDO='@gitroom/[A-Za-z0-9_./-]+|@postiz/[A-Za-z0-9_./-]+|\b[A-Z0-9_]*POSTIZ[A-Z0-9_]*\b|gitroomhq/postiz-[a-z-]+'

# 0. Que existe todo lo que se revisa (si Postiz mueve una carpeta, que no salga un 0 falso)
for ruta in "${ALCANCE[@]}" libraries/react-shared-libraries/src/translation/locales/{es,en}/translation.json \
            apps/frontend/src/app/colors.scss; do
  [ -e "$ruta" ] || resto "no existe $ruta (¿Postiz la movió?)"
done

# 1. El nombre con mayúscula, en cualquier parte del código (también lo oculto)
while IFS= read -r linea; do resto "$linea"; done < <(
  grep -rIn -E '\b(Postiz|Gitroom)\b' "${ALCANCE[@]}" 2>/dev/null)

# 2. Enlaces y direcciones de Postiz
while IFS= read -r linea; do resto "$linea"; done < <(
  grep -rIn -E -i '(postiz|gitroom)\.(com|pro|app|dev)|chromewebstore[^"'\'' ]*postiz' "${ALCANCE[@]}" 2>/dev/null)

# 3. Archivos de public/ que se llaman postiz-… o logo… usados en el código
while IFS= read -r linea; do resto "$linea"; done < <(
  grep -rIn -E "['\"(]/postiz[-.a-z]*\.(svg|png)" apps/frontend/src 2>/dev/null)

# 3b. «postiz»/«gitroom» en minúsculas dentro de textos que se ven (placeholder, alt, title, aria-label, label)
while IFS= read -r linea; do resto "$linea"; done < <(
  grep -rIn -i -E '(placeholder|alt|title|aria-label|label)=?[[:space:]]*[{]?["'\''`][^"'\''`]*(postiz|gitroom)' apps/frontend/src 2>/dev/null)

# 3c. Colores de Postiz (morado) en vez de los de Dímelo Web
while IFS= read -r linea; do resto "$linea"; done < <(
  grep -rIn -i -E '#(612bd3|7236f1|5520cb)\b' apps/frontend/src libraries/react-shared-libraries/src 2>/dev/null)

# 4. Traducciones en español e inglés: ningún valor dice Postiz o Gitroom (las claves sí pueden)
for idioma in es en; do
  json="libraries/react-shared-libraries/src/translation/locales/$idioma/translation.json"
  while IFS= read -r linea; do resto "$json: $linea"; done < <(
    python3 -I -c '
import json, re, sys
for k, v in json.load(open(sys.argv[1], encoding="utf-8")).items():
    if isinstance(v, str) and re.search(r"postiz|gitroom", v, re.I):
        print(f"{k} = {v[:120]}")' "$json" || echo "no pude leer el archivo")
done

# 5. Logos e iconos: los de Dímelo Web
for f in marca/public/*; do
  cmp -s "$f" "apps/frontend/public/$(basename "$f")" || resto "apps/frontend/public/$(basename "$f") no es el de marca/public"
done
grep -q 'Dímelo Redes' apps/frontend/src/components/new-layout/logo.tsx || resto "logo del menú sin cambiar"
grep -q 'Dímelo Redes' apps/frontend/src/components/ui/logo-text.component.tsx || resto "logo de la entrada sin cambiar"

# 6. Enlace al código fuente
grep -q 'CodigoFuente' "apps/frontend/src/app/(app)/auth/layout.tsx" || resto "falta «Código fuente» en la entrada"
grep -q 'CodigoFuente' apps/frontend/src/components/layout/settings.component.tsx || resto "falta «Código fuente» en Ajustes"

# 7. Páginas servidas (opcional): título, texto y enlaces sin Postiz
if [ $# -ge 1 ]; then
  BASE="${1%/}"
  RUTAS=(/auth/login /auth /auth/forgot /p/no-existe)
  CURL=(curl -sL --max-time 60)
  if [ -n "${AUTH:-}" ]; then
    RUTAS=(/launches /settings /media /analytics /esta-pagina-no-existe /p/no-existe)
    CURL+=(-H "Cookie: auth=$AUTH")
  fi
  for ruta in "${RUTAS[@]}"; do
    html="$("${CURL[@]}" "$BASE$ruta")" || { resto "$ruta no responde"; continue; }
    [ -n "$html" ] || { resto "$ruta vacía"; continue; }
    limpio="$(printf '%s' "$html" | perl -pe "s{$PERMITIDO}{}g")"
    if printf '%s' "$limpio" | grep -q -i -E 'postiz|gitroom'; then
      resto "$ruta: $(printf '%s' "$limpio" | grep -o -i -E '.{0,60}(postiz|gitroom).{0,60}' | head -3 | tr '\n' ' ')"
    fi
    printf '%s' "$html" | grep -q '<title>[^<]*Dímelo Redes' || resto "$ruta: el título no dice Dímelo Redes"
  done
fi

if [ "$RESTOS" -gt 0 ]; then
  echo "Quedan $RESTOS resto(s) de Postiz a la vista."
  exit 1
fi
echo "0 restos de Postiz."
