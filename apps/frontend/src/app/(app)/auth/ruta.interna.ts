// Dímelo Redes (RED-03): adónde volver después de entrar. Solo una ruta de este mismo sitio, siempre relativa
// (empieza por una sola «/»): nunca otro sitio, ni «//otro», ni «\», ni javascript:, data: u otro esquema.
// Una dirección completa solo se acepta si es de este mismo origen, y se guarda ya convertida en ruta.
// Sin dependencias para poder probarlo con node --test (ruta.interna.spec.ts).
export const rutaInterna = (valor: unknown, origen: string): string | null => {
  if (typeof valor !== 'string' || !valor || valor.length > 2048) {
    return null;
  }
  // Los navegadores quitan tabuladores y saltos de línea al leer una dirección («/\t/otro» acaba en «//otro»)
  // y tratan «\» como «/»: fuera cualquiera de ellos
  if (/[\u0000-\u001f\u007f\\]/.test(valor)) {
    return null;
  }
  let ruta = valor;
  if (!ruta.startsWith('/')) {
    let direccion: URL;
    try {
      direccion = new URL(ruta);
    } catch {
      return null;
    }
    if (
      (direccion.protocol !== 'https:' && direccion.protocol !== 'http:') ||
      direccion.origin !== origen
    ) {
      return null;
    }
    ruta = direccion.pathname + direccion.search + direccion.hash;
  }
  if (!ruta.startsWith('/') || ruta.startsWith('//')) {
    return null;
  }
  try {
    if (new URL(ruta, origen).origin !== origen) {
      return null;
    }
  } catch {
    return null;
  }
  return ruta;
};
