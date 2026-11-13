
// Dímelo Redes: enlace discreto al código fuente (licencia AGPL-3.0 de Postiz).
// Si hay versión publicada, el enlace va a esa etiqueta del repositorio.
const VERSION = process.env.NEXT_PUBLIC_VERSION;
export const CODIGO_FUENTE_URL = VERSION
  ? `https://github.com/Aridio/dimelo-redes/tree/${VERSION}`
  : 'https://github.com/Aridio/dimelo-redes';

export const CodigoFuente = () => {
  return (
    <a
      href={CODIGO_FUENTE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[12px] opacity-60 hover:opacity-100 hover:underline transition-opacity"
    >
      Código fuente (basado en Postiz, AGPL-3.0)
    </a>
  );
};
