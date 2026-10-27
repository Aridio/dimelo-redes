'use client';

// Dímelo Redes: entrar con la cuenta de Mi Dímelo. El cuadro «Dímelo Redes» de Mi Dímelo trae aquí; esta página pide el
// enlace del acceso propio (GENERIC) y va a Mi Dímelo, que devuelve a la persona ya dentro del espacio de su negocio.
// La sesión anterior (quizá de otro negocio) ya la borró proxy.ts al llegar.
import { useEffect, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export default function EntrarConMiDimelo() {
  const fetch = useFetch();
  const [fallo, setFallo] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/auth/oauth/GENERIC');
        if (!response.ok) throw new Error(String(response.status));
        window.location.href = await response.text();
      } catch {
        setFallo(true);
      }
    })();
  }, []);
  return (
    <div className="flex flex-col gap-[16px] text-[16px]" role="status">
      {fallo ? (
        <>
          <p>No se pudo abrir Dímelo Redes ahora. Inténtalo en un momento.</p>
          <a className="underline" href="https://admin.dimeloweb.com/panel">
            Volver a Mi Dímelo
          </a>
        </>
      ) : (
        <p>Entrando a Dímelo Redes…</p>
      )}
    </div>
  );
}
