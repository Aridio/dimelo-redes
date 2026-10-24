# Icono de Dímelo Redes: la burbuja guayaba de favicon.svg de dimeloweb.com con «Dí» en trazos (Bricolage Grotesque 800).
# Uso: python icono.py <fuente-800.ttf> <salida.svg>
import sys, uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
FONT, OUT = sys.argv[1], sys.argv[2]
tt = TTFont(FONT); gs = tt.getGlyphSet(); upm = tt["head"].unitsPerEm
font = hb.Font(hb.Face(hb.Blob.from_file_path(FONT)))
buf = hb.Buffer(); buf.add_str("Dí"); buf.guess_segment_properties(); hb.shape(font, buf, {"kern": True})
glyphs=[]; x=0
for i,p in zip(buf.glyph_infos, buf.glyph_positions):
    glyphs.append((tt.getGlyphName(i.codepoint), x+p.x_offset, p.y_offset)); x += p.x_advance - 30
s = 30/upm  # mismo tamaño que el <text font-size="30"> del favicon
bp = BoundsPen(gs)
for n,gx,gy in glyphs: gs[n].draw(TransformPen(bp,(s,0,0,-s,gx*s,-gy*s)))
x0,y0,x1,y1 = bp.bounds
ox = 32-(x0+x1)/2; oy = 44  # centrado horizontal, línea base 44 como el favicon
pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
for n,gx,gy in glyphs: gs[n].draw(TransformPen(pen,(s,0,0,-s,ox+gx*s,oy-gy*s)))
bubble = "M19.2 0h25.6A19.2 19.2 0 0 1 64 19.2v25.6A19.2 19.2 0 0 1 44.8 64H5.1A5.1 5.1 0 0 1 0 58.9V19.2A19.2 19.2 0 0 1 19.2 0z"
open(OUT,"w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Dímelo Redes"><title>Dímelo Redes</title><path fill="#c62f47" d="{bubble}"/><path fill="#fff" d="{pen.getCommands()}"/></svg>\n')
