// Dímelo Redes: enlace discreto al código fuente (AGPL-3.0, § 13: quien usa la herramienta por la red puede descargar
// el código que la hace funcionar). RED-13: lleva a la etiqueta exacta que se sirve (NEXT_PUBLIC_VERSION, la pone la
// construcción: vX.Y.Z-dwN) y dice de qué programa sale. marca/aplicar.sh § 5 no cambia este archivo y
// marca/comprobar.sh permite solo esta frase.
const REPOSITORIO = 'https://github.com/Aridio/dimelo-redes';
const VERSION = process.env.NEXT_PUBLIC_VERSION || '';

export const CODIGO_FUENTE_URL = /^v\d+\.\d+\.\d+-dw\d+$/.test(VERSION)
  ? `${REPOSITORIO}/tree/${VERSION}`
  : REPOSITORIO;

export const CodigoFuente = () => {
  return (
    <a
      href={CODIGO_FUENTE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[12px] opacity-60 hover:opacity-100 hover:underline transition-opacity"
    >
      Código fuente · basado en Postiz (AGPL-3.0)
    </a>
  );
};
