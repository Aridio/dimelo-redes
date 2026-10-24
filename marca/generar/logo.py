# Genera el logo de Dímelo Redes en SVG con las letras convertidas a trazos (receta `logo` de DESIGN.md).
# Uso: python generar-logo.py <fuente.ttf> <carpeta de salida>
# La fuente: el woff2 de @fontsource-variable/bricolage-grotesque (wght) pasado a TTF, fijado en 800 y sin trazos
# superpuestos (fontTools: instantiateVariableFont + removeOverlaps). Los PNG y PDF se exportan con un navegador.
import sys, uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

FONT = sys.argv[1]; OUT = sys.argv[2]
tt = TTFont(FONT); gs = tt.getGlyphSet()
blob = hb.Blob.from_file_path(FONT); face = hb.Face(blob); font = hb.Font(face)
font.set_variations({"wght": 800})
LS = -30  # letter-spacing -0.03em

def shape(text):
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": True})
    out=[]; x=0
    for info,pos in zip(buf.glyph_infos, buf.glyph_positions):
        out.append((tt.getGlyphName(info.codepoint), x+pos.x_offset, pos.y_offset)); x += pos.x_advance + LS
    return out, x

def path_for(glyphs, ox, baseline):
    pen = SVGPathPen(gs); bp = BoundsPen(gs)
    for name,x,y in glyphs:
        t = (1,0,0,-1, ox+x, baseline-y)
        gs[name].draw(TransformPen(pen, t)); gs[name].draw(TransformPen(bp, t))
    return pen.getCommands(), bp.bounds

d_glyphs, d_adv = shape("Dímelo")
w_glyphs, w_adv = shape("Redes")
BASE = 830                      # línea base con line-height 1 (ascent 930, descent 270)
bw = 260 + d_adv + 260; bh = 60 + 1000 + 120
d_path, _ = path_for(d_glyphs, 260, 60 + BASE)
wx = bw + 140
w_path, wb = path_for(w_glyphs, wx, (bh - 1000)/2 + BASE)
R, r = 340, 80
bubble = f"M{R},0H{bw-R}A{R},{R} 0 0 1 {bw},{R}V{bh-R}A{R},{R} 0 0 1 {bw-R},{bh}H{r}A{r},{r} 0 0 1 0,{bh-r}V{R}A{R},{R} 0 0 1 {R},0Z"
W = round(max(wb[2], bw)); H = bh

variantes = {
  "dimeloredes-logo-color":   ("#c62f47", "#ffffff", "#14201c"),  # sobre fondo claro
  "dimeloredes-logo-oscuro":  ("#c62f47", "#ffffff", "#eef2ee"),  # sobre fondo oscuro
  "dimeloredes-logo-negro":   ("#000000", "#ffffff", "#000000"),  # una tinta, negro (las letras de la burbuja calan el fondo)
  "dimeloredes-logo-blanco":  ("#ffffff", "#000000", "#ffffff"),  # una tinta, blanco
}
for nombre,(burbuja,letras,web) in variantes.items():
    if nombre in ("dimeloredes-logo-negro","dimeloredes-logo-blanco"):
        # Una sola tinta: las letras de «Dímelo» se recortan de la burbuja (sin color de letra propio).
        body = f'<path fill="{burbuja}" fill-rule="evenodd" d="{bubble}{d_path}"/>\n  <path fill="{web}" d="{w_path}"/>'
    else:
        body = f'<path fill="{burbuja}" d="{bubble}"/>\n  <path fill="{letras}" d="{d_path}"/>\n  <path fill="{web}" d="{w_path}"/>'
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W/10:g}" height="{H/10:g}" role="img" aria-label="Dímelo Redes">\n'
           f'  <title>Dímelo Redes</title>\n  {body}\n</svg>\n')
    open(f"{OUT}/{nombre}.svg","w").write(svg)
print(W, H, bw)
